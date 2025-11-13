import { getDatabase } from '../utils/db.js';
import { EditRequest } from '../types/models.js';

/**
 * Repository for edit request database operations
 */
export class EditRepository {
  /**
   * Get edit request by ID
   */
  async getById(id: string): Promise<EditRequest | null> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        'SELECT * FROM edit_requests WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve((row as EditRequest) || null);
        }
      );
    });
  }

  /**
   * Get all edit requests for a session
   */
  async getBySessionId(sessionId: string): Promise<EditRequest[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        'SELECT * FROM edit_requests WHERE session_id = ? ORDER BY created_at DESC',
        [sessionId],
        (err, rows) => {
          if (err) reject(err);
          else resolve((rows || []) as EditRequest[]);
        }
      );
    });
  }

  /**
   * Get recent edit requests for a session (last N)
   */
  async getRecentBySessionId(sessionId: string, limit: number = 10): Promise<EditRequest[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        'SELECT * FROM edit_requests WHERE session_id = ? ORDER BY created_at DESC LIMIT ?',
        [sessionId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve((rows || []) as EditRequest[]);
        }
      );
    });
  }

  /**
   * Get edit requests by status
   */
  async getByStatus(sessionId: string, status: string): Promise<EditRequest[]> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        'SELECT * FROM edit_requests WHERE session_id = ? AND status = ? ORDER BY created_at DESC',
        [sessionId, status],
        (err, rows) => {
          if (err) reject(err);
          else resolve((rows || []) as EditRequest[]);
        }
      );
    });
  }

  /**
   * Get stats about edit requests for a session
   */
  async getStats(sessionId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
  }> {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM edit_requests
        WHERE session_id = ?`,
        [sessionId],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              total: row?.total || 0,
              completed: row?.completed || 0,
              failed: row?.failed || 0,
              pending: row?.pending || 0
            });
          }
        }
      );
    });
  }
}

// Export singleton instance
export const editRepository = new EditRepository();
