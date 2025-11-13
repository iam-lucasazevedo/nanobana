import { getDatabase } from '../utils/db.js';
import { GenerationRequest } from '../types/models.js';

/**
 * Data access layer for generation requests
 */
export class GenerationRepository {
  /**
   * Get a generation request by ID
   */
  getById(id: string): GenerationRequest | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM generation_requests WHERE id = ?');
    const req = stmt.get(id) as unknown as GenerationRequest | undefined;
    return req || null;
  }

  /**
   * Get all generation requests for a session
   */
  getBySessionId(sessionId: string): GenerationRequest[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM generation_requests WHERE session_id = ? ORDER BY created_at DESC'
    );
    return stmt.all(sessionId) as unknown as GenerationRequest[];
  }

  /**
   * Get recent generation requests for a session (limit)
   */
  getRecentBySessionId(sessionId: string, limit: number = 10): GenerationRequest[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM generation_requests WHERE session_id = ? ORDER BY created_at DESC LIMIT ?'
    );
    return stmt.all(sessionId, limit) as unknown as GenerationRequest[];
  }

  /**
   * Get requests by status
   */
  getByStatus(status: 'pending' | 'completed' | 'failed'): GenerationRequest[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM generation_requests WHERE status = ? ORDER BY created_at DESC'
    );
    return stmt.all(status) as unknown as GenerationRequest[];
  }

  /**
   * Get generation stats for a session
   */
  getStats(sessionId: string): {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  } {
    const db = getDatabase();
    const stmt = db.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM generation_requests WHERE session_id = ?`
    );
    const stats = stmt.get(sessionId) as any;
    return {
      total: stats.total || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0,
      pending: stats.pending || 0
    };
  }
}

// Export singleton instance
export const generationRepository = new GenerationRepository();
