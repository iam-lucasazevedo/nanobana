/**
 * Database initialization and connection management for Supabase PostgreSQL
 * Uses Supabase REST API directly for table operations (no RPC functions needed)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { initializeLogger, getLogger } from './logger.js';
import { getConfigSync } from './config.js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client for PostgreSQL database access
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const config = getConfigSync();
    const logger = initializeLogger();

    if (supabaseClient) {
      logger.debug('Database already initialized');
      return;
    }

    logger.debug('Initializing Supabase PostgreSQL client', {
      url: config.supabase.url,
      bucketName: config.supabase.bucketName,
    });

    // Initialize Supabase client
    supabaseClient = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': 'nano-banana-backend/0.2.0',
        },
      },
    });

    // Test the connection by attempting a simple query
    const { error } = await supabaseClient
      .from('user_sessions')
      .select('session_id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      throw new Error(
        `Failed to connect to Supabase database: ${error.message}. ` +
        `Check your SUPABASE_URL, SUPABASE_ANON_KEY, and ensure database tables exist.`
      );
    }

    logger.info('Supabase database connection established and verified');
  } catch (error) {
    const logger = initializeLogger();
    logger.error('Failed to initialize database', error as Error);
    throw error;
  }
}

/**
 * Get the Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() at startup first.'
    );
  }
  return supabaseClient;
}

/**
 * Close database connection (graceful shutdown)
 */
export async function closeDatabase(): Promise<void> {
  try {
    if (supabaseClient) {
      const logger = initializeLogger();
      logger.debug('Closing Supabase client');
      supabaseClient = null;
    }
  } catch (error) {
    const logger = initializeLogger();
    logger.error('Error closing database', error as Error);
  }
}

/**
 * Database adapter that provides SQLite-like interface for Supabase
 */
export interface DatabaseAdapter {
  run(
    sql: string,
    params: any[],
    callback: (err: Error | null) => void
  ): void;
  get<T>(
    sql: string,
    params: any[],
    callback: (err: Error | null, row?: T) => void
  ): void;
  all<T>(
    sql: string,
    params: any[],
    callback: (err: Error | null, rows?: T[]) => void
  ): void;
  prepare(sql: string): any;
}

/**
 * Parse INSERT statement and execute via Supabase
 */
async function executeInsert(sql: string, params: any[], client: SupabaseClient): Promise<void> {
  // Extract table name from INSERT statement
  const tableMatch = sql.match(/INSERT INTO (\w+)/i);
  if (!tableMatch) throw new Error(`Cannot parse INSERT statement: ${sql}`);

  const tableName = tableMatch[1];
  const columnMatch = sql.match(/\((.*?)\) VALUES/i);
  if (!columnMatch) throw new Error(`Cannot parse column list: ${sql}`);

  const columns = columnMatch[1].split(',').map(c => c.trim());
  const data: any = {};

  columns.forEach((col, idx) => {
    data[col] = params[idx];
  });

  const { error } = await client.from(tableName).insert([data]);
  if (error) throw error;
}

/**
 * Parse UPDATE statement and execute via Supabase
 */
async function executeUpdate(sql: string, params: any[], client: SupabaseClient): Promise<void> {
  // Extract table name
  const tableMatch = sql.match(/UPDATE (\w+)/i);
  if (!tableMatch) throw new Error(`Cannot parse UPDATE statement: ${sql}`);

  const tableName = tableMatch[1];

  // Extract SET clause
  const setMatch = sql.match(/SET (.*?) WHERE/i);
  if (!setMatch) throw new Error(`Cannot parse SET clause: ${sql}`);

  const setClauses = setMatch[1].split(',').map(c => c.trim());
  const data: any = {};
  let paramIdx = 0;

  setClauses.forEach(clause => {
    const [col] = clause.split('=').map(c => c.trim());
    data[col] = params[paramIdx++];
  });

  // Extract WHERE clause
  const whereMatch = sql.match(/WHERE (.*?)$/i);
  if (!whereMatch) throw new Error(`Cannot parse WHERE clause: ${sql}`);

  const whereClause = whereMatch[1].trim();
  const [whereCol] = whereClause.split('=').map(c => c.trim());
  const whereValue = params[paramIdx];

  const { error } = await client
    .from(tableName)
    .update(data)
    .eq(whereCol, whereValue);

  if (error) throw error;
}

/**
 * Parse DELETE statement and execute via Supabase
 */
async function executeDelete(sql: string, params: any[], client: SupabaseClient): Promise<void> {
  // Extract table name
  const tableMatch = sql.match(/DELETE FROM (\w+)/i);
  if (!tableMatch) throw new Error(`Cannot parse DELETE statement: ${sql}`);

  const tableName = tableMatch[1];

  // Extract WHERE clause
  const whereMatch = sql.match(/WHERE (.*?)$/i);
  if (!whereMatch) throw new Error(`Cannot parse WHERE clause: ${sql}`);

  const whereClause = whereMatch[1].trim();
  const [whereCol] = whereClause.split('=').map(c => c.trim());
  const whereValue = params[0];

  const { error } = await client
    .from(tableName)
    .delete()
    .eq(whereCol, whereValue);

  if (error) throw error;
}

/**
 * Parse SELECT statement and execute via Supabase
 */
async function executeSelect(sql: string, params: any[], client: SupabaseClient): Promise<any[]> {
  // Extract table name
  const tableMatch = sql.match(/FROM (\w+)/i);
  if (!tableMatch) throw new Error(`Cannot parse SELECT statement: ${sql}`);

  const tableName = tableMatch[1];
  let query = client.from(tableName).select('*');

  // Parse WHERE clause if exists
  const whereMatch = sql.match(/WHERE (.*?)(?:ORDER|LIMIT|$)/i);
  if (whereMatch) {
    const whereClause = whereMatch[1].trim();
    const conditions = whereClause.split(/\s+AND\s+/i);

    conditions.forEach((condition, idx) => {
      const [col] = condition.split('=').map(c => c.trim());
      query = query.eq(col, params[idx]);
    });
  }

  // Parse ORDER BY clause if exists
  const orderMatch = sql.match(/ORDER BY (\w+)(?:\s+(ASC|DESC))?/i);
  if (orderMatch) {
    const [, col, dir] = orderMatch;
    query = query.order(col, { ascending: dir !== 'DESC' });
  }

  // Parse LIMIT clause if exists
  const limitMatch = sql.match(/LIMIT (\d+)/i);
  if (limitMatch) {
    const limit = parseInt(limitMatch[1], 10);
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Create a database adapter that wraps Supabase in SQLite-like callback patterns
 */
function createDatabaseAdapter(): DatabaseAdapter {
  const client = supabaseClient;
  if (!client) {
    throw new Error('Database not initialized');
  }

  return {
    run(sql: string, params: any[] = [], callback: (err: Error | null) => void) {
      try {
        // Determine statement type
        const stmt = sql.trim().toUpperCase();
        let promise: Promise<void>;

        if (stmt.startsWith('INSERT')) {
          promise = executeInsert(sql, params, client);
        } else if (stmt.startsWith('UPDATE')) {
          promise = executeUpdate(sql, params, client);
        } else if (stmt.startsWith('DELETE')) {
          promise = executeDelete(sql, params, client);
        } else {
          throw new Error(`Unsupported SQL statement: ${sql.substring(0, 50)}`);
        }

        Promise.resolve(promise)
          .then(() => callback(null))
          .catch((error: any) => {
            callback(new Error(`Database error: ${error?.message || String(error)}`));
          });
      } catch (error: any) {
        callback(new Error(`Database error: ${error?.message || String(error)}`));
      }
    },

    get<T>(sql: string, params: any[] = [], callback: (err: Error | null, row?: T) => void) {
      Promise.resolve(executeSelect(sql, params, client))
        .then((rows: any[]) => {
          const row = rows && rows.length > 0 ? (rows[0] as T) : undefined;
          callback(null, row);
        })
        .catch((error: any) => {
          callback(new Error(`Database error: ${error?.message || String(error)}`));
        });
    },

    all<T>(sql: string, params: any[] = [], callback: (err: Error | null, rows?: T[]) => void) {
      Promise.resolve(executeSelect(sql, params, client))
        .then((rows: any[]) => {
          callback(null, (rows as T[]) || []);
        })
        .catch((error: any) => {
          callback(new Error(`Database error: ${error?.message || String(error)}`));
        });
    },

    prepare(sql: string): any {
      return {
        get(...params: any[]): any {
          getLogger().warn('synchronous db.prepare().get() is not supported with Supabase');
          return null;
        },
        all(...params: any[]): any[] {
          getLogger().warn('synchronous db.prepare().all() is not supported with Supabase');
          return [];
        },
      };
    },
  };
}

/**
 * Get the database adapter (provides SQLite-like callback interface)
 */
export function getDatabase(): DatabaseAdapter {
  if (!supabaseClient) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() at startup first.'
    );
  }
  return createDatabaseAdapter();
}
