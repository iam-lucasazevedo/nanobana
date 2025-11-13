import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../utils/db.js';
import {
  UserSession,
  UserPreferences,
  GenerationRequest,
  EditRequest,
  SessionResponse
} from '../types/models.js';

/**
 * Helper function to run a database query with callback
 */
function dbRun(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Helper function to get a single row
 */
function dbGet<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

/**
 * Helper function to get all rows
 */
function dbAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows || []) as T[]);
    });
  });
}

export class SessionService {
  /**
   * Create a new session
   */
  async createSession(): Promise<UserSession> {
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      'INSERT INTO user_sessions (session_id, created_at, last_accessed_at) VALUES (?, ?, ?)',
      [sessionId, now, now]
    );

    // Initialize preferences for this session
    await dbRun(
      'INSERT INTO user_preferences (session_id, preferred_size, preferred_style, preferred_aspect_ratio, last_active_mode) VALUES (?, ?, ?, ?, ?)',
      [sessionId, '1024x768', 'default', '16:9', 'generation']
    );

    return { session_id: sessionId, created_at: now, last_accessed_at: now };
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<UserSession | null> {
    const session = await dbGet<UserSession>(
      'SELECT * FROM user_sessions WHERE session_id = ?',
      [sessionId]
    );
    return session || null;
  }

  /**
   * Update session's last accessed time
   */
  async updateSessionLastAccess(sessionId: string): Promise<void> {
    const now = new Date().toISOString();
    await dbRun(
      'UPDATE user_sessions SET last_accessed_at = ? WHERE session_id = ?',
      [now, sessionId]
    );
  }

  /**
   * Get full session with history and preferences
   */
  async getFullSession(sessionId: string): Promise<SessionResponse | null> {
    // Get session
    const session = await this.getSession(sessionId);
    if (!session) return null;

    // Update last access
    await this.updateSessionLastAccess(sessionId);

    // Get preferences
    const prefs = await dbGet<UserPreferences>(
      'SELECT * FROM user_preferences WHERE session_id = ?',
      [sessionId]
    );

    // Get generation history (last 10)
    const generationHistory = await dbAll<GenerationRequest>(
      'SELECT * FROM generation_requests WHERE session_id = ? ORDER BY created_at DESC LIMIT 10',
      [sessionId]
    );

    // Get edit history (last 10)
    const editHistory = await dbAll<EditRequest>(
      'SELECT * FROM edit_requests WHERE session_id = ? ORDER BY created_at DESC LIMIT 10',
      [sessionId]
    );

    // Extract recent prompts (last 5 unique)
    const recentPrompts = Array.from(
      new Set(generationHistory.map((r) => r.prompt))
    ).slice(0, 5);

    // Extract recent edit prompts (last 5 unique)
    const recentEditPrompts = Array.from(
      new Set(editHistory.map((r) => r.edit_prompt))
    ).slice(0, 5);

    return {
      sessionId,
      recentPrompts,
      recentEditPrompts,
      preferredSize: prefs?.preferred_size || '1024x768',
      preferredStyle: prefs?.preferred_style || 'default',
      preferredAspectRatio: prefs?.preferred_aspect_ratio || '16:9',
      lastActiveMode: (prefs?.last_active_mode as 'generation' | 'edit') || 'generation',
      generationHistory: generationHistory.reverse(),
      editHistory: editHistory.reverse(),
      createdAt: session.created_at
    };
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    sessionId: string,
    updates: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    // Convert camelCase keys to snake_case
    const camelToSnakeCase = (str: string): string => {
      return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    };

    const fields = Object.keys(updates)
      .filter((k) => k !== 'session_id')
      .map((k) => `${camelToSnakeCase(k)} = ?`);

    if (fields.length === 0) {
      const prefs = await dbGet<UserPreferences>(
        'SELECT * FROM user_preferences WHERE session_id = ?',
        [sessionId]
      );
      return prefs || ({} as UserPreferences);
    }

    const values = Object.entries(updates)
      .filter(([k]) => k !== 'session_id')
      .map(([, v]) => v);

    await dbRun(
      `UPDATE user_preferences SET ${fields.join(', ')} WHERE session_id = ?`,
      [...values, sessionId]
    );

    const prefs = await dbGet<UserPreferences>(
      'SELECT * FROM user_preferences WHERE session_id = ?',
      [sessionId]
    );
    return prefs || ({} as UserPreferences);
  }

  /**
   * Update the last active mode for a session
   * @param sessionId - Session ID
   * @param mode - 'generation' or 'edit'
   */
  async updateActiveMode(
    sessionId: string,
    mode: 'generation' | 'edit'
  ): Promise<void> {
    await dbRun(
      'UPDATE user_preferences SET last_active_mode = ? WHERE session_id = ?',
      [mode, sessionId]
    );
  }

  /**
   * Add a generation request to session history
   */
  async addGenerationRequest(req: GenerationRequest): Promise<void> {
    await dbRun(
      'INSERT INTO generation_requests (id, session_id, prompt, size, style, aspect_ratio, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.id,
        req.session_id,
        req.prompt,
        req.size,
        req.style,
        req.aspect_ratio,
        req.status,
        req.created_at
      ]
    );
  }

  /**
   * Add an edit request to session history
   */
  async addEditRequest(req: EditRequest): Promise<void> {
    await dbRun(
      'INSERT INTO edit_requests (id, session_id, edit_prompt, style, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [req.id, req.session_id, req.edit_prompt, req.style, req.status, req.created_at]
    );
  }

  /**
   * Update generation request status
   */
  async updateGenerationStatus(
    id: string,
    status: 'pending' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await dbRun(
      'UPDATE generation_requests SET status = ?, error_message = ? WHERE id = ?',
      [status, errorMessage || null, id]
    );
  }

  /**
   * Update edit request status
   */
  async updateEditStatus(
    id: string,
    status: 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await dbRun(
      'UPDATE edit_requests SET status = ?, error_message = ? WHERE id = ?',
      [status, errorMessage || null, id]
    );
  }
}

// Export singleton instance
export const sessionService = new SessionService();
