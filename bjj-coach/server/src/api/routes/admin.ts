import { Router } from 'express';
import type Database from 'better-sqlite3';

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

export function createAdminRouter(db: Database.Database): Router {
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

  // Import technique library data (descriptions + youtube URLs)
  // POST /api/admin/import-technique-library?secret=...
  // Body: [{ id: number, youtube_url: string | null, description: string | null }, ...]
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
