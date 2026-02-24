import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { AIProvider } from '../../ai/provider.js';
import type { ChannelManager } from '../../channels/manager.js';
import type { User, ConversationEntry } from '../../db/types.js';
import type { Platform } from '../../utils/constants.js';
import { CONVERSATION_MODES } from '../../utils/constants.js';
import { getUserById, setConversationMode, setScheduledAction } from '../../db/queries/users.js';
import { getPrimaryChannel } from '../../db/queries/channels.js';
import { getRecentMessages, addMessage } from '../../db/queries/conversations.js';
import { getPositionsByUserId } from '../../db/queries/positions.js';
import { getTechniquesByUserId } from '../../db/queries/techniques.js';
import { getRecentSessionsByUserId } from '../../db/queries/sessions.js';
import { getActiveFocusPeriod } from '../../db/queries/focusPeriods.js';
import { getAllGoals } from '../../db/queries/goals.js';
import { handleCheckIn } from '../../core/handlers/checkin.js';
import { handleBriefing } from '../../core/handlers/briefing.js';
import { handleDebrief } from '../../core/handlers/debrief.js';
import { buildCheckInPrompt } from '../../ai/prompts.js';
import { buildBriefingPrompt } from '../../ai/prompts.js';
import { buildDebriefPrompt } from '../../ai/prompts.js';
import { getUserLocalDate, getUserLocalTime, parseTrainingSchedule, parseTime } from '../../utils/time.js';
import { getTokenUsageSummary } from '../../db/queries/tokenUsage.js';

function buildUrl(path: string, secret: string, extraParams?: Record<string, string | number>): string {
  const params = new URLSearchParams({ secret });
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      params.set(k, String(v));
    }
  }
  return `${path}?${params.toString()}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '<span class="null">NULL</span>';
  const str = String(value);
  // Try to detect and pretty-print JSON
  if (str.startsWith('[') || str.startsWith('{')) {
    try {
      const parsed = JSON.parse(str);
      const pretty = JSON.stringify(parsed, null, 2);
      return `<span class="json" title="${escapeHtml(pretty)}">${escapeHtml(str)}</span>`;
    } catch { /* not JSON, fall through */ }
  }
  return `<span title="${escapeHtml(str)}">${escapeHtml(str)}</span>`;
}

const PAGE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #1a1a2e;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 24px;
    min-height: 100vh;
  }
  a { color: #64b5f6; text-decoration: none; }
  a:hover { text-decoration: underline; color: #90caf9; }
  h1 {
    font-size: 1.6rem;
    margin-bottom: 8px;
    color: #fff;
  }
  .subtitle {
    color: #888;
    font-size: 0.9rem;
    margin-bottom: 24px;
  }
  .nav { margin-bottom: 20px; }
  .nav a { margin-right: 16px; font-size: 0.9rem; }

  /* Table list page */
  .table-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
    max-width: 900px;
  }
  .table-card {
    background: #16213e;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: border-color 0.15s, background 0.15s;
  }
  .table-card:hover {
    border-color: #64b5f6;
    background: #1a2744;
  }
  .table-card .name { font-weight: 600; font-size: 1rem; }
  .table-card .count {
    background: #2a2a4a;
    color: #aaa;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  /* Data table page */
  .table-wrap {
    overflow-x: auto;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    max-width: 100%;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.82rem;
    white-space: nowrap;
  }
  thead { position: sticky; top: 0; z-index: 1; }
  th {
    background: #0f3460;
    color: #e0e0e0;
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid #1a1a2e;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  td {
    padding: 8px 14px;
    border-bottom: 1px solid #1e1e3a;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  tr:nth-child(even) td { background: #16213e; }
  tr:nth-child(odd) td { background: #1a1a2e; }
  tr:hover td { background: #1a2744; }
  .null { color: #666; font-style: italic; }
  .json { color: #81c784; cursor: help; }

  /* Pagination */
  .pagination {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 16px;
    font-size: 0.9rem;
  }
  .pagination .info { color: #888; }
  .btn {
    display: inline-block;
    padding: 6px 16px;
    background: #0f3460;
    color: #e0e0e0;
    border-radius: 6px;
    font-size: 0.85rem;
    transition: background 0.15s;
  }
  .btn:hover { background: #1a4a7a; text-decoration: none; }
  .btn.disabled { opacity: 0.4; pointer-events: none; }

  .empty {
    padding: 40px;
    text-align: center;
    color: #666;
    font-size: 1rem;
  }

  /* User list */
  .user-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 12px;
    max-width: 1000px;
  }
  .user-card {
    background: #16213e;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: border-color 0.15s, background 0.15s;
  }
  .user-card:hover {
    border-color: #64b5f6;
    background: #1a2744;
  }
  .user-card .user-info { display: flex; flex-direction: column; gap: 4px; }
  .user-card .user-name { font-weight: 600; font-size: 1rem; color: #fff; }
  .user-card .user-meta { font-size: 0.8rem; color: #888; }
  .user-card .user-badges { display: flex; gap: 6px; align-items: center; }

  /* Mode badges */
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .badge-idle { background: #2a3a2a; color: #81c784; }
  .badge-onboarding { background: #3a2a1a; color: #ffb74d; }
  .badge-check_in { background: #1a2a3a; color: #64b5f6; }
  .badge-briefing { background: #3a2a3a; color: #ce93d8; }
  .badge-debrief { background: #2a2a3a; color: #9fa8da; }
  .badge-free_chat { background: #2a3a3a; color: #80cbc4; }
  .badge-belt {
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .belt-white { background: #ddd; color: #333; }
  .belt-blue { background: #1565c0; color: #fff; }
  .belt-purple { background: #6a1b9a; color: #fff; }
  .belt-brown { background: #5d4037; color: #fff; }
  .belt-black { background: #212121; color: #fff; }

  /* Profile page */
  .profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    max-width: 800px;
    margin-bottom: 24px;
  }
  .profile-field {
    background: #16213e;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 12px 16px;
  }
  .profile-field .label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .profile-field .value {
    font-size: 0.95rem;
    color: #e0e0e0;
    word-break: break-word;
  }
  .profile-field.full-width {
    grid-column: 1 / -1;
  }
  .stats-row {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .stat-box {
    background: #16213e;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 16px 20px;
    text-align: center;
    min-width: 120px;
  }
  .stat-box .stat-num {
    font-size: 1.8rem;
    font-weight: 700;
    color: #fff;
  }
  .stat-box .stat-label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    margin-top: 4px;
  }

  /* Action buttons */
  .actions {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .btn-action {
    display: inline-block;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    transition: background 0.15s, transform 0.1s;
    cursor: pointer;
  }
  .btn-action:hover { text-decoration: none; transform: translateY(-1px); }
  .btn-briefing { background: #e65100; color: #fff; }
  .btn-briefing:hover { background: #ff6d00; color: #fff; }
  .btn-debrief { background: #6a1b9a; color: #fff; }
  .btn-debrief:hover { background: #8e24aa; color: #fff; }
  .btn-convo { background: #0f3460; color: #e0e0e0; }
  .btn-convo:hover { background: #1a4a7a; color: #fff; }

  /* Result boxes */
  .result-box {
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    max-width: 800px;
  }
  .result-success {
    background: #1b3a1b;
    border: 1px solid #2e7d32;
  }
  .result-error {
    background: #3a1b1b;
    border: 1px solid #c62828;
  }
  .result-box .result-title {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 8px;
  }
  .result-success .result-title { color: #81c784; }
  .result-error .result-title { color: #ef9a9a; }
  .result-box .result-body {
    font-size: 0.9rem;
    line-height: 1.6;
    white-space: pre-wrap;
    color: #e0e0e0;
  }
  .result-box .result-meta {
    font-size: 0.8rem;
    color: #888;
    margin-top: 12px;
  }

  /* Chat bubbles */
  .chat-container {
    max-width: 700px;
  }
  .chat-msg {
    display: flex;
    margin-bottom: 12px;
  }
  .chat-msg.assistant { justify-content: flex-start; }
  .chat-msg.user { justify-content: flex-end; }
  .chat-bubble {
    max-width: 75%;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 0.9rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .chat-msg.assistant .chat-bubble {
    background: #16213e;
    border: 1px solid #2a2a4a;
    border-bottom-left-radius: 4px;
    color: #e0e0e0;
  }
  .chat-msg.user .chat-bubble {
    background: #0f3460;
    border: 1px solid #1a4a7a;
    border-bottom-right-radius: 4px;
    color: #fff;
  }
  .chat-meta {
    font-size: 0.7rem;
    color: #666;
    margin-top: 4px;
  }
  .chat-msg.assistant .chat-meta { text-align: left; }
  .chat-msg.user .chat-meta { text-align: right; }

  /* Simulator */
  .sim-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    max-width: 1200px;
    margin-bottom: 24px;
  }
  @media (max-width: 900px) {
    .sim-grid { grid-template-columns: 1fr; }
  }
  .sim-card {
    background: #16213e;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 20px;
  }
  .sim-card h3 {
    font-size: 1rem;
    margin-bottom: 12px;
    color: #fff;
  }
  .sim-card .sim-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .sim-card .sim-actions a {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    transition: background 0.15s;
  }
  .btn-preview { background: #1565c0; color: #fff; }
  .btn-preview:hover { background: #1976d2; color: #fff; text-decoration: none; }
  .btn-send { background: #e65100; color: #fff; }
  .btn-send:hover { background: #ff6d00; color: #fff; text-decoration: none; }
  .btn-context { background: #2a2a4a; color: #ccc; }
  .btn-context:hover { background: #3a3a5a; color: #fff; text-decoration: none; }
  .btn-sim { background: #2e7d32; color: #fff; }
  .btn-sim:hover { background: #388e3c; color: #fff; text-decoration: none; }

  .diag-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
    margin-bottom: 24px;
    max-width: 1200px;
  }
  .diag-box {
    background: #16213e;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 12px 16px;
  }
  .diag-box .label {
    font-size: 0.7rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .diag-box .value {
    font-size: 0.9rem;
    color: #e0e0e0;
    word-break: break-word;
  }

  .context-block {
    background: #0d1117;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 20px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.78rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 600px;
    overflow-y: auto;
    color: #c9d1d9;
    max-width: 900px;
  }

  .preview-card {
    background: #16213e;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    max-width: 900px;
  }
  .preview-card h3 {
    font-size: 1rem;
    color: #fff;
    margin-bottom: 12px;
  }
  .preview-msg {
    background: #1a1a2e;
    border-radius: 8px;
    padding: 16px;
    font-size: 0.9rem;
    line-height: 1.6;
    white-space: pre-wrap;
    color: #e0e0e0;
    margin-bottom: 12px;
  }
  .preview-data {
    background: #0d1117;
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    padding: 12px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.78rem;
    color: #81c784;
    white-space: pre-wrap;
    margin-bottom: 12px;
  }
  .preview-meta {
    font-size: 0.8rem;
    color: #888;
  }
`;

function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${PAGE_STYLES}</style>
</head>
<body>
${body}
</body>
</html>`;
}

export function createAdminRouter(db: Database.Database, ai: AIProvider, channels: ChannelManager): Router {
  const router = Router();

  // Simple secret check — set ADMIN_SECRET in Railway env vars
  router.use((req, res, next) => {
    const secret = req.query.secret || req.headers['x-admin-secret'];
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  });

  // List all tables — styled HTML
  router.get('/tables', (req, res) => {
    const secret = String(req.query.secret || '');
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as { name: string }[];

    // Get row counts
    const tableCards = tables.map(t => {
      const count = (db.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).get() as any).count;
      const url = buildUrl(`/api/admin/table/${t.name}`, secret);
      return `<a href="${escapeHtml(url)}" class="table-card">
        <span class="name">${escapeHtml(t.name)}</span>
        <span class="count">${count} rows</span>
      </a>`;
    });

    const totalRows = tables.reduce((sum, t) => {
      return sum + ((db.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).get() as any).count as number);
    }, 0);

    const body = `
      <div class="nav">
        <a href="${escapeHtml(buildUrl('/api/admin/users', secret))}">Users &rarr;</a>
      </div>
      <h1>Database Tables</h1>
      <p class="subtitle">${tables.length} tables &middot; ${totalRows} total rows</p>
      <div class="table-list">
        ${tableCards.join('\n        ')}
      </div>
    `;

    res.type('html').send(htmlPage('Admin — Tables', body));
  });

  // Browse a table — styled HTML with pagination
  router.get('/table/:name', (req, res) => {
    const secret = String(req.query.secret || '');
    const tableName = req.params.name;

    // Validate table name to prevent SQL injection
    const validTables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all().map((t: any) => t.name);

    if (!validTables.includes(tableName)) {
      const body = `
        <div class="nav"><a href="${escapeHtml(buildUrl('/api/admin/tables', secret))}">&larr; Back to tables</a></div>
        <div class="empty">Table "${escapeHtml(tableName)}" not found.</div>
      `;
      res.status(404).type('html').send(htmlPage('Not Found', body));
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const offset = Number(req.query.offset) || 0;

    const rows = db.prepare(`SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`).all(limit, offset) as Record<string, unknown>[];
    const totalCount = (db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get() as any).count as number;

    const backUrl = buildUrl('/api/admin/tables', secret);

    // Build table HTML
    let tableHtml: string;
    if (rows.length === 0) {
      tableHtml = '<div class="empty">No rows in this table.</div>';
    } else {
      const columns = Object.keys(rows[0]);
      const headerRow = columns.map(col => `<th>${escapeHtml(col)}</th>`).join('');
      const dataRows = rows.map(row => {
        const cells = columns.map(col => `<td>${formatCellValue(row[col])}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('\n');

      tableHtml = `
        <div class="table-wrap">
          <table>
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${dataRows}</tbody>
          </table>
        </div>
      `;
    }

    // Pagination
    const hasPrev = offset > 0;
    const hasNext = offset + limit < totalCount;
    const prevUrl = hasPrev ? buildUrl(`/api/admin/table/${tableName}`, secret, { limit, offset: Math.max(0, offset - limit) }) : '#';
    const nextUrl = hasNext ? buildUrl(`/api/admin/table/${tableName}`, secret, { limit, offset: offset + limit }) : '#';

    const showingFrom = totalCount === 0 ? 0 : offset + 1;
    const showingTo = Math.min(offset + limit, totalCount);

    const body = `
      <div class="nav">
        <a href="${escapeHtml(backUrl)}">&larr; Back to tables</a>
      </div>
      <h1>${escapeHtml(tableName)}</h1>
      <p class="subtitle">${totalCount} rows total &middot; showing ${showingFrom}–${showingTo}</p>
      ${tableHtml}
      <div class="pagination">
        <a href="${escapeHtml(prevUrl)}" class="btn ${hasPrev ? '' : 'disabled'}">&larr; Previous</a>
        <span class="info">Page ${Math.floor(offset / limit) + 1} of ${Math.max(1, Math.ceil(totalCount / limit))}</span>
        <a href="${escapeHtml(nextUrl)}" class="btn ${hasNext ? '' : 'disabled'}">Next &rarr;</a>
      </div>
    `;

    res.type('html').send(htmlPage(`Admin — ${tableName}`, body));
  });

  // ─── User list ───────────────────────────────────────────────
  router.get('/users', (req, res) => {
    const secret = String(req.query.secret || '');
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as User[];

    const cards = users.map(u => {
      const channel = getPrimaryChannel(db, u.id);
      const platform = channel ? channel.platform : 'none';
      const belt = u.belt_rank || 'none';
      const mode = u.conversation_mode || 'idle';
      const url = buildUrl(`/api/admin/user/${u.id}`, secret);

      return `<a href="${escapeHtml(url)}" class="user-card">
        <div class="user-info">
          <span class="user-name">${escapeHtml(u.name || 'Unnamed')}</span>
          <span class="user-meta">${escapeHtml(platform)} &middot; joined ${escapeHtml(u.created_at.split('T')[0])}</span>
        </div>
        <div class="user-badges">
          ${belt !== 'none' ? `<span class="badge badge-belt belt-${escapeHtml(belt)}">${escapeHtml(belt)}</span>` : ''}
          <span class="badge badge-${escapeHtml(mode)}">${escapeHtml(mode)}</span>
        </div>
      </a>`;
    });

    const body = `
      <div class="nav">
        <a href="${escapeHtml(buildUrl('/api/admin/tables', secret))}">&larr; Tables</a>
      </div>
      <h1>Users</h1>
      <p class="subtitle">${users.length} user${users.length !== 1 ? 's' : ''}</p>
      ${users.length === 0
        ? '<div class="empty">No users yet.</div>'
        : `<div class="user-list">${cards.join('\n')}</div>`
      }
    `;

    res.type('html').send(htmlPage('Admin — Users', body));
  });

  // ─── User profile ──────────────────────────────────────────
  router.get('/user/:id', (req, res) => {
    const secret = String(req.query.secret || '');
    const user = getUserById(db, req.params.id);

    if (!user) {
      const body = `
        <div class="nav"><a href="${escapeHtml(buildUrl('/api/admin/users', secret))}">&larr; Back to users</a></div>
        <div class="empty">User not found.</div>
      `;
      res.status(404).type('html').send(htmlPage('Not Found', body));
      return;
    }

    const channel = getPrimaryChannel(db, user.id);
    const positions = getPositionsByUserId(db, user.id);
    const techniques = getTechniquesByUserId(db, user.id);
    const sessions = getRecentSessionsByUserId(db, user.id, 100);
    const goals = getAllGoals(db, user.id);
    const activeFocus = getActiveFocusPeriod(db, user.id);

    const mode = user.conversation_mode || 'idle';
    const belt = user.belt_rank || 'none';

    const field = (label: string, value: string | number | null | undefined, fullWidth = false) => `
      <div class="profile-field${fullWidth ? ' full-width' : ''}">
        <div class="label">${escapeHtml(label)}</div>
        <div class="value">${value !== null && value !== undefined ? escapeHtml(String(value)) : '<span class="null">Not set</span>'}</div>
      </div>
    `;

    const checkinUrl = buildUrl(`/api/admin/user/${user.id}/trigger-checkin`, secret);
    const briefingUrl = buildUrl(`/api/admin/user/${user.id}/trigger-briefing`, secret);
    const debriefUrl = buildUrl(`/api/admin/user/${user.id}/trigger-debrief`, secret);
    const convoUrl = buildUrl(`/api/admin/user/${user.id}/conversation`, secret);
    const simUrl = buildUrl(`/api/admin/user/${user.id}/simulator`, secret);

    const body = `
      <div class="nav">
        <a href="${escapeHtml(buildUrl('/api/admin/users', secret))}">&larr; Back to users</a>
        <a href="${escapeHtml(buildUrl('/api/admin/tables', secret))}">Tables</a>
      </div>
      <h1>${escapeHtml(user.name || 'Unnamed User')}</h1>
      <p class="subtitle">
        ${belt !== 'none' ? `<span class="badge badge-belt belt-${escapeHtml(belt)}">${escapeHtml(belt)} belt</span> &middot; ` : ''}
        <span class="badge badge-${escapeHtml(mode)}">${escapeHtml(mode)}</span>
        &middot; ${escapeHtml(user.id)}
      </p>

      <div class="stats-row">
        <div class="stat-box"><div class="stat-num">${positions.length}</div><div class="stat-label">Positions</div></div>
        <div class="stat-box"><div class="stat-num">${techniques.length}</div><div class="stat-label">Techniques</div></div>
        <div class="stat-box"><div class="stat-num">${sessions.length}</div><div class="stat-label">Sessions</div></div>
        <div class="stat-box"><div class="stat-num">${goals.length}</div><div class="stat-label">Goals</div></div>
      </div>

      <div class="actions">
        <a href="${escapeHtml(checkinUrl)}" class="btn-action btn-briefing"
           onclick="return confirm('Send a check-in message to this user now?')">Trigger Check-In</a>
        <a href="${escapeHtml(briefingUrl)}" class="btn-action btn-briefing"
           onclick="return confirm('Send a briefing message to this user now?')">Trigger Briefing</a>
        <a href="${escapeHtml(debriefUrl)}" class="btn-action btn-debrief"
           onclick="return confirm('Send a debrief message to this user now?')">Trigger Debrief</a>
        <a href="${escapeHtml(convoUrl)}" class="btn-action btn-convo">Conversation History</a>
        <a href="${escapeHtml(simUrl)}" class="btn-action btn-convo" style="background:#2e7d32;">Outreach Simulator</a>
      </div>

      <div class="profile-grid">
        ${field('Name', user.name)}
        ${field('Email', user.email)}
        ${field('Belt Rank', user.belt_rank)}
        ${field('Experience', user.experience_months !== null ? `${user.experience_months} months` : null)}
        ${field('Game Style', user.preferred_game_style)}
        ${field('Timezone', user.timezone)}
        ${field('Training Days', user.training_days)}
        ${field('Training Time', user.typical_training_time)}
        ${field('Current Focus', user.current_focus_area)}
        ${field('Conversation Mode', user.conversation_mode)}
        ${field('Onboarding Complete', user.onboarding_complete ? 'Yes' : 'No')}
        ${field('Last Scheduled', user.last_scheduled_action ? `${user.last_scheduled_action} on ${user.last_scheduled_date}` : null)}
        ${field('Platform', channel ? `${channel.platform} (${channel.platform_user_id})` : 'None')}
        ${field('Created', user.created_at)}
        ${field('Injuries / Limitations', user.injuries_limitations, true)}
        ${field('Goals', user.goals, true)}
        ${activeFocus ? field('Active Focus Period', `${activeFocus.name} (${activeFocus.status})`, true) : ''}
      </div>
    `;

    res.type('html').send(htmlPage(`Admin — ${user.name || 'User'}`, body));
  });

  // ─── Trigger briefing ──────────────────────────────────────
  router.get('/user/:id/trigger-briefing', async (req, res) => {
    const secret = String(req.query.secret || '');
    const user = getUserById(db, req.params.id);

    if (!user) {
      res.status(404).type('html').send(htmlPage('Not Found', '<div class="empty">User not found.</div>'));
      return;
    }

    const backUrl = buildUrl(`/api/admin/user/${user.id}`, secret);
    let resultHtml: string;

    try {
      const channel = getPrimaryChannel(db, user.id);
      const timezone = user.timezone || 'America/New_York';
      const localDate = getUserLocalDate(timezone);

      // Replicate exact Scheduler.sendBriefing() flow
      setConversationMode(db, user.id, CONVERSATION_MODES.BRIEFING);
      const response = await handleBriefing(db, ai, user, '');

      // Store in conversation history
      const platform = channel ? channel.platform as Platform : 'web';
      addMessage(db, user.id, 'assistant', response, platform);

      // Track that briefing was sent today
      setScheduledAction(db, user.id, 'briefing', localDate);

      // Attempt delivery
      let deliveryStatus = 'No channel — message stored but not delivered';
      if (channel) {
        try {
          await channels.sendMessage(channel.platform as Platform, channel.platform_user_id, response);
          deliveryStatus = `Delivered via ${channel.platform}`;
        } catch (sendErr) {
          deliveryStatus = `Delivery failed (${channel.platform}): ${(sendErr as Error).message}`;
        }
      }

      resultHtml = `
        <div class="result-box result-success">
          <div class="result-title">Briefing Sent</div>
          <div class="result-body">${escapeHtml(response)}</div>
          <div class="result-meta">
            ${escapeHtml(deliveryStatus)} &middot; Mode set to <span class="badge badge-briefing">briefing</span> &middot; ${escapeHtml(localDate)}
          </div>
        </div>
      `;
    } catch (err) {
      resultHtml = `
        <div class="result-box result-error">
          <div class="result-title">Briefing Failed</div>
          <div class="result-body">${escapeHtml((err as Error).message)}</div>
        </div>
      `;
    }

    const body = `
      <div class="nav">
        <a href="${escapeHtml(backUrl)}">&larr; Back to ${escapeHtml(user.name || 'user')}</a>
      </div>
      <h1>Trigger Briefing — ${escapeHtml(user.name || 'User')}</h1>
      ${resultHtml}
    `;

    res.type('html').send(htmlPage('Admin — Trigger Briefing', body));
  });

  // ─── Trigger debrief ───────────────────────────────────────
  router.get('/user/:id/trigger-debrief', async (req, res) => {
    const secret = String(req.query.secret || '');
    const user = getUserById(db, req.params.id);

    if (!user) {
      res.status(404).type('html').send(htmlPage('Not Found', '<div class="empty">User not found.</div>'));
      return;
    }

    const backUrl = buildUrl(`/api/admin/user/${user.id}`, secret);
    let resultHtml: string;

    try {
      const channel = getPrimaryChannel(db, user.id);
      const timezone = user.timezone || 'America/New_York';
      const localDate = getUserLocalDate(timezone);

      // Replicate exact Scheduler.sendDebrief() flow
      setConversationMode(db, user.id, CONVERSATION_MODES.DEBRIEF);
      const response = await handleDebrief(db, ai, user, '');

      // Store in conversation history
      const platform = channel ? channel.platform as Platform : 'web';
      addMessage(db, user.id, 'assistant', response, platform);

      // Track that debrief was sent today
      setScheduledAction(db, user.id, 'debrief', localDate);

      // Attempt delivery
      let deliveryStatus = 'No channel — message stored but not delivered';
      if (channel) {
        try {
          await channels.sendMessage(channel.platform as Platform, channel.platform_user_id, response);
          deliveryStatus = `Delivered via ${channel.platform}`;
        } catch (sendErr) {
          deliveryStatus = `Delivery failed (${channel.platform}): ${(sendErr as Error).message}`;
        }
      }

      resultHtml = `
        <div class="result-box result-success">
          <div class="result-title">Debrief Sent</div>
          <div class="result-body">${escapeHtml(response)}</div>
          <div class="result-meta">
            ${escapeHtml(deliveryStatus)} &middot; Mode set to <span class="badge badge-debrief">debrief</span> &middot; ${escapeHtml(localDate)}
          </div>
        </div>
      `;
    } catch (err) {
      resultHtml = `
        <div class="result-box result-error">
          <div class="result-title">Debrief Failed</div>
          <div class="result-body">${escapeHtml((err as Error).message)}</div>
        </div>
      `;
    }

    const body = `
      <div class="nav">
        <a href="${escapeHtml(backUrl)}">&larr; Back to ${escapeHtml(user.name || 'user')}</a>
      </div>
      <h1>Trigger Debrief — ${escapeHtml(user.name || 'User')}</h1>
      ${resultHtml}
    `;

    res.type('html').send(htmlPage('Admin — Trigger Debrief', body));
  });

  // ─── Conversation history ──────────────────────────────────
  router.get('/user/:id/conversation', (req, res) => {
    const secret = String(req.query.secret || '');
    const user = getUserById(db, req.params.id);

    if (!user) {
      res.status(404).type('html').send(htmlPage('Not Found', '<div class="empty">User not found.</div>'));
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const totalCount = (db.prepare(
      'SELECT COUNT(*) as count FROM conversation_history WHERE user_id = ?'
    ).get(user.id) as any).count as number;

    const messages = db.prepare(
      'SELECT * FROM conversation_history WHERE user_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?'
    ).all(user.id, limit, offset) as ConversationEntry[];

    const backUrl = buildUrl(`/api/admin/user/${user.id}`, secret);

    const bubbles = messages.map(m => {
      const time = m.created_at.replace('T', ' ').replace(/\.\d+Z$/, '');
      return `<div class="chat-msg ${escapeHtml(m.role)}">
        <div>
          <div class="chat-bubble">${escapeHtml(m.content)}</div>
          <div class="chat-meta">${escapeHtml(time)} &middot; ${escapeHtml(m.platform)}</div>
        </div>
      </div>`;
    });

    // Pagination
    const hasPrev = offset > 0;
    const hasNext = offset + limit < totalCount;
    const prevUrl = hasPrev ? buildUrl(`/api/admin/user/${user.id}/conversation`, secret, { limit, offset: Math.max(0, offset - limit) }) : '#';
    const nextUrl = hasNext ? buildUrl(`/api/admin/user/${user.id}/conversation`, secret, { limit, offset: offset + limit }) : '#';
    const showingFrom = totalCount === 0 ? 0 : offset + 1;
    const showingTo = Math.min(offset + limit, totalCount);

    const body = `
      <div class="nav">
        <a href="${escapeHtml(backUrl)}">&larr; Back to ${escapeHtml(user.name || 'user')}</a>
      </div>
      <h1>Conversation — ${escapeHtml(user.name || 'User')}</h1>
      <p class="subtitle">${totalCount} messages &middot; showing ${showingFrom}–${showingTo}</p>
      ${messages.length === 0
        ? '<div class="empty">No messages yet.</div>'
        : `<div class="chat-container">${bubbles.join('\n')}</div>`
      }
      <div class="pagination">
        <a href="${escapeHtml(prevUrl)}" class="btn ${hasPrev ? '' : 'disabled'}">&larr; Newer</a>
        <span class="info">Page ${Math.floor(offset / limit) + 1} of ${Math.max(1, Math.ceil(totalCount / limit))}</span>
        <a href="${escapeHtml(nextUrl)}" class="btn ${hasNext ? '' : 'disabled'}">Older &rarr;</a>
      </div>
    `;

    res.type('html').send(htmlPage(`Admin — Conversation — ${user.name || 'User'}`, body));
  });

  // ─── Trigger check-in ────────────────────────────────────
  router.get('/user/:id/trigger-checkin', async (req, res) => {
    const secret = String(req.query.secret || '');
    const user = getUserById(db, req.params.id);

    if (!user) {
      res.status(404).type('html').send(htmlPage('Not Found', '<div class="empty">User not found.</div>'));
      return;
    }

    const backUrl = buildUrl(`/api/admin/user/${user.id}`, secret);
    let resultHtml: string;

    try {
      const channel = getPrimaryChannel(db, user.id);
      const timezone = user.timezone || 'America/New_York';
      const localDate = getUserLocalDate(timezone);

      // Replicate exact Scheduler.sendCheckIn() flow
      setConversationMode(db, user.id, CONVERSATION_MODES.CHECK_IN);
      const response = await handleCheckIn(db, ai, user, '');

      // Store in conversation history
      const platform = channel ? channel.platform as Platform : 'web';
      addMessage(db, user.id, 'assistant', response, platform);

      // Track that check-in was sent today
      setScheduledAction(db, user.id, 'checkin', localDate);

      // Attempt delivery
      let deliveryStatus = 'No channel — message stored but not delivered';
      if (channel) {
        try {
          await channels.sendMessage(channel.platform as Platform, channel.platform_user_id, response);
          deliveryStatus = `Delivered via ${channel.platform}`;
        } catch (sendErr) {
          deliveryStatus = `Delivery failed (${channel.platform}): ${(sendErr as Error).message}`;
        }
      }

      resultHtml = `
        <div class="result-box result-success">
          <div class="result-title">Check-In Sent</div>
          <div class="result-body">${escapeHtml(response)}</div>
          <div class="result-meta">
            ${escapeHtml(deliveryStatus)} &middot; Mode set to <span class="badge badge-check_in">check_in</span> &middot; ${escapeHtml(localDate)}
          </div>
        </div>
      `;
    } catch (err) {
      resultHtml = `
        <div class="result-box result-error">
          <div class="result-title">Check-In Failed</div>
          <div class="result-body">${escapeHtml((err as Error).message)}</div>
        </div>
      `;
    }

    const body = `
      <div class="nav">
        <a href="${escapeHtml(backUrl)}">&larr; Back to ${escapeHtml(user.name || 'user')}</a>
      </div>
      <h1>Trigger Check-In — ${escapeHtml(user.name || 'User')}</h1>
      ${resultHtml}
    `;

    res.type('html').send(htmlPage('Admin — Trigger Check-In', body));
  });

  // ─── Context viewer ─────────────────────────────────────
  router.get('/user/:id/context-:type', (req, res) => {
    const secret = String(req.query.secret || '');
    const outreachType = req.params.type;
    const user = getUserById(db, req.params.id);

    if (!user) {
      res.status(404).type('html').send(htmlPage('Not Found', '<div class="empty">User not found.</div>'));
      return;
    }

    if (!['checkin', 'briefing', 'debrief'].includes(outreachType)) {
      res.status(400).type('html').send(htmlPage('Bad Request', '<div class="empty">Invalid type. Use checkin, briefing, or debrief.</div>'));
      return;
    }

    const backUrl = buildUrl(`/api/admin/user/${user.id}/simulator`, secret);

    // Gather context
    const positions = getPositionsByUserId(db, user.id);
    const techniques = getTechniquesByUserId(db, user.id);
    const recentSessions = getRecentSessionsByUserId(db, user.id, 10);
    const activeFocus = getActiveFocusPeriod(db, user.id);
    const goals = getAllGoals(db, user.id);

    let systemPrompt: string;
    switch (outreachType) {
      case 'checkin':
        systemPrompt = buildCheckInPrompt({ user, recentSessions, activeFocus, goals });
        break;
      case 'briefing':
        systemPrompt = buildBriefingPrompt({ user, positions, techniques, recentSessions, activeFocus, goals });
        break;
      case 'debrief':
        systemPrompt = buildDebriefPrompt({ user, positions, techniques, recentSessions, activeFocus, goals });
        break;
      default:
        systemPrompt = '';
    }

    // Get conversation history that would be sent
    const history = getRecentMessages(db, user.id, 30);
    const historyText = history.length > 0
      ? history.map(m => `[${m.role}] ${m.content}`).join('\n\n')
      : '(no conversation history)';

    const estimatedTokens = Math.ceil((systemPrompt.length + historyText.length) / 4);

    const body = `
      <div class="nav">
        <a href="${escapeHtml(backUrl)}">&larr; Back to simulator</a>
      </div>
      <h1>Context: ${escapeHtml(outreachType)} — ${escapeHtml(user.name || 'User')}</h1>
      <p class="subtitle">Estimated tokens: ~${estimatedTokens.toLocaleString()} &middot; System prompt: ${systemPrompt.length.toLocaleString()} chars &middot; History: ${history.length} messages</p>

      <h2 style="margin: 20px 0 12px; font-size: 1.1rem; color: #fff;">System Prompt</h2>
      <div class="context-block">${escapeHtml(systemPrompt)}</div>

      <h2 style="margin: 20px 0 12px; font-size: 1.1rem; color: #fff;">Conversation History (${history.length} messages)</h2>
      <div class="context-block">${escapeHtml(historyText)}</div>
    `;

    res.type('html').send(htmlPage(`Admin — Context — ${outreachType}`, body));
  });

  // ─── Preview endpoint (no side effects) ──────────────────
  router.get('/user/:id/preview-:type', async (req, res) => {
    const secret = String(req.query.secret || '');
    const outreachType = req.params.type;
    const user = getUserById(db, req.params.id);

    if (!user) {
      res.status(404).type('html').send(htmlPage('Not Found', '<div class="empty">User not found.</div>'));
      return;
    }

    if (!['checkin', 'briefing', 'debrief'].includes(outreachType)) {
      res.status(400).type('html').send(htmlPage('Bad Request', '<div class="empty">Invalid type. Use checkin, briefing, or debrief.</div>'));
      return;
    }

    const backUrl = buildUrl(`/api/admin/user/${user.id}/simulator`, secret);

    // Gather context
    const positions = getPositionsByUserId(db, user.id);
    const techniques = getTechniquesByUserId(db, user.id);
    const recentSessions = getRecentSessionsByUserId(db, user.id, 10);
    const activeFocus = getActiveFocusPeriod(db, user.id);
    const goals = getAllGoals(db, user.id);

    let systemPrompt: string;
    switch (outreachType) {
      case 'checkin':
        systemPrompt = buildCheckInPrompt({ user, recentSessions, activeFocus, goals });
        break;
      case 'briefing':
        systemPrompt = buildBriefingPrompt({ user, positions, techniques, recentSessions, activeFocus, goals });
        break;
      case 'debrief':
        systemPrompt = buildDebriefPrompt({ user, positions, techniques, recentSessions, activeFocus, goals });
        break;
      default:
        systemPrompt = '';
    }

    // Get conversation history (read-only — we won't add anything)
    const history = getRecentMessages(db, user.id, 30);
    const messages = history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    let resultHtml: string;
    try {
      const start = Date.now();
      const { text: raw } = await ai.sendMessage(systemPrompt, messages);
      const elapsed = Date.now() - start;

      // Parse but don't act on data
      const dataDelim = '---DATA---';
      const dataIdx = raw.indexOf(dataDelim);
      let messageText: string;
      let dataBlock: string | null = null;

      if (dataIdx !== -1) {
        messageText = raw.slice(0, dataIdx).trim();
        dataBlock = raw.slice(dataIdx + dataDelim.length).trim();
      } else {
        messageText = raw.trim();
      }

      // Build "Send For Real" URL based on type
      const triggerUrl = buildUrl(`/api/admin/user/${user.id}/trigger-${outreachType === 'checkin' ? 'checkin' : outreachType}`, secret);

      resultHtml = `
        <div class="preview-card">
          <h3>Preview: ${escapeHtml(outreachType)}</h3>
          <div class="preview-msg">${escapeHtml(messageText)}</div>
          ${dataBlock ? `<div class="preview-data">${escapeHtml(dataBlock)}</div>` : ''}
          <div class="preview-meta">Generated in ${(elapsed / 1000).toFixed(1)}s</div>
          <div style="margin-top: 12px;">
            <a href="${escapeHtml(triggerUrl)}" class="btn-action btn-send"
               onclick="return confirm('Send this ${escapeHtml(outreachType)} for real? This WILL modify the database and send to the user.')">Send For Real</a>
          </div>
        </div>
      `;
    } catch (err) {
      resultHtml = `
        <div class="result-box result-error">
          <div class="result-title">Preview Failed</div>
          <div class="result-body">${escapeHtml((err as Error).message)}</div>
        </div>
      `;
    }

    const body = `
      <div class="nav">
        <a href="${escapeHtml(backUrl)}">&larr; Back to simulator</a>
      </div>
      <h1>Preview: ${escapeHtml(outreachType)} — ${escapeHtml(user.name || 'User')}</h1>
      <p class="subtitle">AI-generated preview — no side effects, nothing stored or sent</p>
      ${resultHtml}
    `;

    res.type('html').send(htmlPage(`Admin — Preview — ${outreachType}`, body));
  });

  // ─── Simulator page ─────────────────────────────────────
  router.get('/user/:id/simulator', (req, res) => {
    const secret = String(req.query.secret || '');
    const user = getUserById(db, req.params.id);

    if (!user) {
      res.status(404).type('html').send(htmlPage('Not Found', '<div class="empty">User not found.</div>'));
      return;
    }

    const backUrl = buildUrl(`/api/admin/user/${user.id}`, secret);

    // Scheduler diagnostics
    const timezone = user.timezone || 'America/New_York';
    const localTime = getUserLocalTime(timezone);
    const localDate = getUserLocalDate(timezone);
    const schedule = parseTrainingSchedule(user.training_days);
    const todayTime = schedule ? schedule[localTime.dayName] : null;
    const trainingTime = todayTime ? parseTime(todayTime) : null;

    const alreadySentToday = user.last_scheduled_date === localDate;
    const lastAction = alreadySentToday ? user.last_scheduled_action : null;

    // Determine next expected action
    let nextAction = 'none (not a training day)';
    if (trainingTime) {
      const nowMinutes = localTime.hour * 60 + localTime.minute;
      const trainingMinutes = trainingTime.hour * 60 + trainingTime.minute;
      const earlyTraining = trainingMinutes < 9 * 60;

      if (!lastAction) {
        if (!earlyTraining && nowMinutes < 8 * 60 + 10) nextAction = 'checkin (~8:00am)';
        else if (nowMinutes < trainingMinutes - 20) nextAction = `briefing (~${trainingMinutes - 30} min mark)`;
        else nextAction = 'briefing window passed';
      } else if (lastAction === 'checkin') {
        if (nowMinutes < trainingMinutes - 20) nextAction = `briefing (~${trainingMinutes - 30} min mark)`;
        else nextAction = 'briefing window passed';
      } else if (lastAction === 'briefing') {
        if (nowMinutes < trainingMinutes + 80) nextAction = `debrief (~${trainingMinutes + 65} min mark)`;
        else nextAction = 'debrief window passed';
      } else if (lastAction === 'debrief') {
        nextAction = 'done for today';
      }
    }

    // Build URLs
    const types = ['checkin', 'briefing', 'debrief'] as const;
    const labels = { checkin: 'Check-In', briefing: 'Briefing', debrief: 'Debrief' };
    const colors = { checkin: '#1565c0', briefing: '#e65100', debrief: '#6a1b9a' };

    const cards = types.map(t => {
      const previewUrl = buildUrl(`/api/admin/user/${user.id}/preview-${t}`, secret);
      const triggerUrl = buildUrl(`/api/admin/user/${user.id}/trigger-${t === 'checkin' ? 'checkin' : t}`, secret);
      const contextUrl = buildUrl(`/api/admin/user/${user.id}/context-${t}`, secret);

      return `
        <div class="sim-card">
          <h3 style="color: ${colors[t]};">${labels[t]}</h3>
          <div class="sim-actions">
            <a href="${escapeHtml(previewUrl)}" class="btn-preview">Preview</a>
            <a href="${escapeHtml(triggerUrl)}" class="btn-send"
               onclick="return confirm('Send ${labels[t]} for real?')">Send</a>
            <a href="${escapeHtml(contextUrl)}" class="btn-context">View Context</a>
          </div>
        </div>
      `;
    });

    const fullLoopUrl = buildUrl(`/api/admin/user/${user.id}/simulate-loop`, secret);

    const body = `
      <div class="nav">
        <a href="${escapeHtml(backUrl)}">&larr; Back to ${escapeHtml(user.name || 'user')}</a>
      </div>
      <h1>Outreach Simulator — ${escapeHtml(user.name || 'User')}</h1>
      <p class="subtitle">Preview what the coach would say without sending anything</p>

      <h2 style="margin: 20px 0 12px; font-size: 1.1rem; color: #fff;">Scheduler Diagnostics</h2>
      <div class="diag-grid">
        <div class="diag-box"><div class="label">Local Time</div><div class="value">${localTime.hour.toString().padStart(2, '0')}:${localTime.minute.toString().padStart(2, '0')}</div></div>
        <div class="diag-box"><div class="label">Day</div><div class="value">${escapeHtml(localTime.dayName)}</div></div>
        <div class="diag-box"><div class="label">Timezone</div><div class="value">${escapeHtml(timezone)}</div></div>
        <div class="diag-box"><div class="label">Training Today</div><div class="value">${todayTime ? `Yes @ ${escapeHtml(todayTime)}` : 'No'}</div></div>
        <div class="diag-box"><div class="label">Last Action</div><div class="value">${lastAction ? escapeHtml(lastAction) : 'none'}</div></div>
        <div class="diag-box"><div class="label">Next Expected</div><div class="value">${escapeHtml(nextAction)}</div></div>
        <div class="diag-box"><div class="label">Mode</div><div class="value"><span class="badge badge-${escapeHtml(user.conversation_mode || 'idle')}">${escapeHtml(user.conversation_mode || 'idle')}</span></div></div>
      </div>

      <h2 style="margin: 20px 0 12px; font-size: 1.1rem; color: #fff;">Outreach Actions</h2>
      <div class="sim-grid">
        ${cards.join('\n')}
      </div>

      <div style="margin-top: 8px;">
        <a href="${escapeHtml(fullLoopUrl)}" class="btn-action btn-sim" style="padding: 12px 24px; font-size: 1rem;">
          Simulate Full Daily Loop
        </a>
        <span style="color: #888; font-size: 0.85rem; margin-left: 12px;">Previews all three — no side effects</span>
      </div>
    `;

    res.type('html').send(htmlPage(`Admin — Simulator — ${user.name || 'User'}`, body));
  });

  // ─── Full loop simulation ───────────────────────────────
  router.get('/user/:id/simulate-loop', async (req, res) => {
    const secret = String(req.query.secret || '');
    const user = getUserById(db, req.params.id);

    if (!user) {
      res.status(404).type('html').send(htmlPage('Not Found', '<div class="empty">User not found.</div>'));
      return;
    }

    const backUrl = buildUrl(`/api/admin/user/${user.id}/simulator`, secret);

    // Gather context once
    const positions = getPositionsByUserId(db, user.id);
    const techniques = getTechniquesByUserId(db, user.id);
    const recentSessions = getRecentSessionsByUserId(db, user.id, 10);
    const activeFocus = getActiveFocusPeriod(db, user.id);
    const goals = getAllGoals(db, user.id);

    // Get conversation history (read-only)
    const history = getRecentMessages(db, user.id, 30);
    const messages = history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const types = [
      { key: 'checkin', label: 'Check-In', color: '#1565c0' },
      { key: 'briefing', label: 'Briefing', color: '#e65100' },
      { key: 'debrief', label: 'Debrief', color: '#6a1b9a' },
    ] as const;

    const previews: string[] = [];
    const totalStart = Date.now();

    for (const t of types) {
      let systemPrompt: string;
      switch (t.key) {
        case 'checkin':
          systemPrompt = buildCheckInPrompt({ user, recentSessions, activeFocus, goals });
          break;
        case 'briefing':
          systemPrompt = buildBriefingPrompt({ user, positions, techniques, recentSessions, activeFocus, goals });
          break;
        case 'debrief':
          systemPrompt = buildDebriefPrompt({ user, positions, techniques, recentSessions, activeFocus, goals });
          break;
      }

      try {
        const start = Date.now();
        const { text: raw } = await ai.sendMessage(systemPrompt, messages);
        const elapsed = Date.now() - start;

        const dataDelim = '---DATA---';
        const dataIdx = raw.indexOf(dataDelim);
        let messageText: string;
        let dataBlock: string | null = null;

        if (dataIdx !== -1) {
          messageText = raw.slice(0, dataIdx).trim();
          dataBlock = raw.slice(dataIdx + dataDelim.length).trim();
        } else {
          messageText = raw.trim();
        }

        previews.push(`
          <div class="preview-card" style="border-left: 3px solid ${t.color};">
            <h3 style="color: ${t.color};">${t.label}</h3>
            <div class="preview-msg">${escapeHtml(messageText)}</div>
            ${dataBlock ? `<div class="preview-data">${escapeHtml(dataBlock)}</div>` : ''}
            <div class="preview-meta">Generated in ${(elapsed / 1000).toFixed(1)}s</div>
          </div>
        `);
      } catch (err) {
        previews.push(`
          <div class="result-box result-error">
            <div class="result-title">${t.label} Failed</div>
            <div class="result-body">${escapeHtml((err as Error).message)}</div>
          </div>
        `);
      }
    }

    const totalElapsed = Date.now() - totalStart;

    const body = `
      <div class="nav">
        <a href="${escapeHtml(backUrl)}">&larr; Back to simulator</a>
      </div>
      <h1>Full Daily Loop — ${escapeHtml(user.name || 'User')}</h1>
      <p class="subtitle">All three previews — no side effects &middot; Total: ${(totalElapsed / 1000).toFixed(1)}s</p>
      <p style="color: #888; font-size: 0.85rem; margin-bottom: 20px;">Note: Each preview is independent. Earlier responses don't feed into later ones since nothing is persisted.</p>
      ${previews.join('\n')}
    `;

    res.type('html').send(htmlPage(`Admin — Full Loop — ${user.name || 'User'}`, body));
  });

  // Import technique library data (descriptions + youtube URLs)
  // POST /api/admin/import-technique-library?secret=...
  // Body: [{ id: number, youtube_url: string | null, description: string | null }, ...]
  router.get('/token-usage', (req, res) => {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;
    const rows = getTokenUsageSummary(db, days);
    res.json(rows);
  });

  router.post('/import-technique-library', (req, res) => {
    const rows = req.body;
    if (!Array.isArray(rows)) {
      res.status(400).json({ error: 'Body must be a JSON array' });
      return;
    }

    const updateYoutube = db.prepare('UPDATE technique_library SET youtube_url = ? WHERE id = ?');
    const updateDescription = db.prepare('UPDATE technique_library SET description = ? WHERE id = ?');

    let youtubeUpdated = 0;
    let descriptionUpdated = 0;
    let skipped = 0;

    const runAll = db.transaction(() => {
      for (const row of rows) {
        if (!row.id) { skipped++; continue; }
        if (row.youtube_url !== undefined) {
          updateYoutube.run(row.youtube_url, row.id);
          youtubeUpdated++;
        }
        if (row.description !== undefined) {
          updateDescription.run(row.description, row.id);
          descriptionUpdated++;
        }
      }
    });

    runAll();

    res.json({
      success: true,
      total: rows.length,
      youtubeUpdated,
      descriptionUpdated,
      skipped,
    });
  });

  return router;
}
