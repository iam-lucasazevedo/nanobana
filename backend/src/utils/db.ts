/**
 * Database initialization and connection management for Supabase PostgreSQL
 * Replaces SQLite with cloud-hosted PostgreSQL for production deployment
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
    const { data, error } = await supabaseClient
      .from('sessions')
      .select('count', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      throw new Error(
        `Failed to connect to Supabase database: ${error.message}. ` +
        `Check your SUPABASE_URL and SUPABASE_ANON_KEY environment variables.`
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
 * Prepared statement object that provides synchronous-like interface
 */
export interface PreparedStatement {
  get(...params: any[]): any;
  all(...params: any[]): any[];
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
  prepare(sql: string): PreparedStatement;
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
      // Convert SQLite params to Supabase numbered params
      let query = sql;
      params.forEach((param, index) => {
        query = query.replace('?', `$${index + 1}`);
      });

      // Execute through RPC
      Promise.resolve(
        client.rpc('exec_sql', {
          sql_query: query,
          parameters: params.length > 0 ? params : null,
        })
      )
        .then(() => {
          callback(null);
        })
        .catch((error: any) => {
          callback(new Error(`Database query failed: ${error?.message || String(error)}`));
        });
    },

    get<T>(sql: string, params: any[] = [], callback: (err: Error | null, row?: T) => void) {
      // Convert SQLite params to Supabase numbered params
      let query = sql;
      params.forEach((param, index) => {
        query = query.replace('?', `$${index + 1}`);
      });

      // Execute through RPC
      Promise.resolve(
        client.rpc('exec_sql_select', {
          sql_query: query,
          parameters: params.length > 0 ? params : null,
        })
      )
        .then((response: any) => {
          const { data, error } = response;
          if (error) {
            callback(new Error(`Database query failed: ${error.message}`));
          } else {
            const row = data && data.length > 0 ? (data[0] as T) : undefined;
            callback(null, row);
          }
        })
        .catch((error: any) => {
          callback(new Error(`Database query failed: ${error?.message || String(error)}`));
        });
    },

    all<T>(sql: string, params: any[] = [], callback: (err: Error | null, rows?: T[]) => void) {
      // Convert SQLite params to Supabase numbered params
      let query = sql;
      params.forEach((param, index) => {
        query = query.replace('?', `$${index + 1}`);
      });

      // Execute through RPC
      Promise.resolve(
        client.rpc('exec_sql_select', {
          sql_query: query,
          parameters: params.length > 0 ? params : null,
        })
      )
        .then((response: any) => {
          const { data, error } = response;
          if (error) {
            callback(new Error(`Database query failed: ${error.message}`));
          } else {
            callback(null, (data as T[]) || []);
          }
        })
        .catch((error: any) => {
          callback(new Error(`Database query failed: ${error?.message || String(error)}`));
        });
    },

    prepare(sql: string): PreparedStatement {
      return {
        get(...params: any[]): any {
          // NOTE: This is a synchronous wrapper that won't work for async Supabase calls
          // The generationRepository needs to be updated to use async methods
          // For now, return a stub implementation
          getLogger().warn('synchronous db.prepare().get() is not supported with Supabase');
          return null;
        },
        all(...params: any[]): any[] {
          // NOTE: This is a synchronous wrapper that won't work for async Supabase calls
          // The generationRepository needs to be updated to use async methods
          // For now, return a stub implementation
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

/**
 * Close database connection (graceful shutdown)
 */
export async function closeDatabase(): Promise<void> {
  try {
    if (supabaseClient) {
      // Supabase doesn't require explicit close, but we can sign out
      // to clean up any auth state
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
 * Legacy SQLite helper wrappers - now execute against Supabase PostgreSQL
 * These wrap SQLite-style SQL in Supabase client calls
 * Note: These are compatibility wrappers. For new code, use Supabase client directly.
 */

/**
 * Execute raw SQL (INSERT, UPDATE, DELETE)
 * Supports parameterized queries with ? placeholders
 */
export async function dbRun(sql: string, params: any[] = []): Promise<void> {
  const logger = initializeLogger();

  return new Promise((resolve, reject) => {
    if (!supabaseClient) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      // Convert SQLite-style ? parameters to Supabase numbered parameters
      let query = sql;
      params.forEach((param, index) => {
        query = query.replace('?', `$${index + 1}`);
      });

      logger.debug('Executing database query', {
        query: sql.substring(0, 100),
        paramCount: params.length,
      });

      // Execute raw SQL through Supabase
      Promise.resolve(
        supabaseClient.rpc('exec_sql', {
          sql_query: query,
          parameters: params.length > 0 ? params : null,
        })
      )
        .then(() => {
          resolve();
        })
        .catch((error: any) => {
          const err = new Error(`Database query failed: ${error?.message || String(error)}`);
          logger.error('dbRun failed', err);
          reject(err);
        });
    } catch (error) {
      logger.error('dbRun failed', error as Error);
      reject(error);
    }
  });
}

/**
 * Execute SQL and return a single row
 * Supports parameterized queries with ? placeholders
 */
export async function dbGet<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  const logger = initializeLogger();

  return new Promise((resolve, reject) => {
    if (!supabaseClient) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      // Convert SQLite-style ? parameters to Supabase numbered parameters
      let query = sql;
      params.forEach((param, index) => {
        query = query.replace('?', `$${index + 1}`);
      });

      logger.debug('Executing database query (get single)', {
        query: sql.substring(0, 100),
        paramCount: params.length,
      });

      // Use Supabase REST API for SQL execution
      Promise.resolve(
        supabaseClient.rpc('exec_sql_select', {
          sql_query: query,
          parameters: params.length > 0 ? params : null,
        })
      )
        .then((response: any) => {
          const { data, error } = response;
          if (error) {
            reject(new Error(`Database query failed: ${error.message}`));
          } else {
            // Return first row or undefined
            resolve(data && data.length > 0 ? (data[0] as T) : undefined);
          }
        })
        .catch((error: any) => {
          const err = new Error(`Database query failed: ${error?.message || String(error)}`);
          logger.error('dbGet failed', err);
          reject(err);
        });
    } catch (error) {
      logger.error('dbGet failed', error as Error);
      reject(error);
    }
  });
}

/**
 * Execute SQL and return all matching rows
 * Supports parameterized queries with ? placeholders
 */
export async function dbAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const logger = initializeLogger();

  return new Promise((resolve, reject) => {
    if (!supabaseClient) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      // Convert SQLite-style ? parameters to Supabase numbered parameters
      let query = sql;
      params.forEach((param, index) => {
        query = query.replace('?', `$${index + 1}`);
      });

      logger.debug('Executing database query (get all)', {
        query: sql.substring(0, 100),
        paramCount: params.length,
      });

      // Use Supabase REST API for SQL execution
      Promise.resolve(
        supabaseClient.rpc('exec_sql_select', {
          sql_query: query,
          parameters: params.length > 0 ? params : null,
        })
      )
        .then((response: any) => {
          const { data, error } = response;
          if (error) {
            reject(new Error(`Database query failed: ${error.message}`));
          } else {
            // Return all rows or empty array
            resolve((data as T[]) || []);
          }
        })
        .catch((error: any) => {
          const err = new Error(`Database query failed: ${error?.message || String(error)}`);
          logger.error('dbAll failed', err);
          reject(err);
        });
    } catch (error) {
      logger.error('dbAll failed', error as Error);
      reject(error);
    }
  });
}
