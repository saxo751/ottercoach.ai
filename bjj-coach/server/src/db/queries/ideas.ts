import type Database from 'better-sqlite3';
import type { FeatureIdea, FeatureIdeaComment } from '../types.js';
import { nowISO } from '../../utils/time.js';

export interface IdeaWithMeta extends FeatureIdea {
  author_name: string | null;
  vote_count: number;
  comment_count: number;
  user_has_voted: number;
}

export interface CommentWithAuthor extends FeatureIdeaComment {
  author_name: string | null;
}

export function createIdea(
  db: Database.Database,
  userId: string,
  title: string,
  description: string,
): FeatureIdea {
  const now = nowISO();
  const result = db.prepare(`
    INSERT INTO feature_ideas (user_id, title, description, status, created_at, updated_at)
    VALUES (?, ?, ?, 'open', ?, ?)
  `).run(userId, title, description, now, now);

  return db.prepare('SELECT * FROM feature_ideas WHERE id = ?').get(result.lastInsertRowid) as FeatureIdea;
}

export function getIdeaById(db: Database.Database, id: number): FeatureIdea | undefined {
  return db.prepare('SELECT * FROM feature_ideas WHERE id = ?').get(id) as FeatureIdea | undefined;
}

export function getAllIdeas(
  db: Database.Database,
  sort: 'newest' | 'top' = 'newest',
  currentUserId?: string,
): IdeaWithMeta[] {
  const orderClause = sort === 'top' ? 'vote_count DESC, fi.created_at DESC' : 'fi.created_at DESC';
  const userIdParam = currentUserId || '';

  return db.prepare(`
    SELECT
      fi.*,
      u.name AS author_name,
      COALESCE(v.cnt, 0) AS vote_count,
      COALESCE(c.cnt, 0) AS comment_count,
      CASE WHEN uv.id IS NOT NULL THEN 1 ELSE 0 END AS user_has_voted
    FROM feature_ideas fi
    LEFT JOIN users u ON u.id = fi.user_id
    LEFT JOIN (SELECT idea_id, COUNT(*) AS cnt FROM feature_idea_votes GROUP BY idea_id) v ON v.idea_id = fi.id
    LEFT JOIN (SELECT idea_id, COUNT(*) AS cnt FROM feature_idea_comments GROUP BY idea_id) c ON c.idea_id = fi.id
    LEFT JOIN feature_idea_votes uv ON uv.idea_id = fi.id AND uv.user_id = ?
    ORDER BY ${orderClause}
  `).all(userIdParam) as IdeaWithMeta[];
}

export function toggleVote(
  db: Database.Database,
  ideaId: number,
  userId: string,
): { voted: boolean; vote_count: number } {
  const existing = db.prepare(
    'SELECT id FROM feature_idea_votes WHERE idea_id = ? AND user_id = ?'
  ).get(ideaId, userId);

  if (existing) {
    db.prepare('DELETE FROM feature_idea_votes WHERE idea_id = ? AND user_id = ?').run(ideaId, userId);
  } else {
    db.prepare(
      'INSERT INTO feature_idea_votes (idea_id, user_id, created_at) VALUES (?, ?, ?)'
    ).run(ideaId, userId, nowISO());
  }

  const row = db.prepare(
    'SELECT COUNT(*) AS cnt FROM feature_idea_votes WHERE idea_id = ?'
  ).get(ideaId) as { cnt: number };

  return { voted: !existing, vote_count: row.cnt };
}

export function createComment(
  db: Database.Database,
  ideaId: number,
  userId: string,
  content: string,
): CommentWithAuthor {
  const now = nowISO();
  const result = db.prepare(
    'INSERT INTO feature_idea_comments (idea_id, user_id, content, created_at) VALUES (?, ?, ?, ?)'
  ).run(ideaId, userId, content, now);

  return db.prepare(`
    SELECT fic.*, u.name AS author_name
    FROM feature_idea_comments fic
    LEFT JOIN users u ON u.id = fic.user_id
    WHERE fic.id = ?
  `).get(result.lastInsertRowid) as CommentWithAuthor;
}

export function getCommentsByIdeaId(db: Database.Database, ideaId: number): CommentWithAuthor[] {
  return db.prepare(`
    SELECT fic.*, u.name AS author_name
    FROM feature_idea_comments fic
    LEFT JOIN users u ON u.id = fic.user_id
    WHERE fic.idea_id = ?
    ORDER BY fic.created_at ASC
  `).all(ideaId) as CommentWithAuthor[];
}
