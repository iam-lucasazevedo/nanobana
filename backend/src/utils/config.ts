/**
 * Centralized configuration system for the Nano Banana backend
 * Loads environment variables, validates required configs, and provides defaults
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type NodeEnv = 'development' | 'testing' | 'production';

export interface Config {
  // Server
  port: number;
  nodeEnv: NodeEnv;

  // Supabase (PostgreSQL + File Storage)
  supabase: {
    url: string;
    anonKey: string;
    bucketName: string;
  };

  // Nano Banana API
  nanoBanana: {
    apiKey: string;
  };

  // Frontend (for CORS)
  frontendUrl: string;

  // Logging
  logLevel: LogLevel;
}

/**
 * Get and validate configuration from environment variables
 * Throws error if required variables are missing
 */
export function getConfig(): Config {
  // Validate required environment variables
  const requiredVars: Record<string, string | undefined> = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_BUCKET_NAME: process.env.SUPABASE_BUCKET_NAME,
    NANO_BANANA_API_KEY: process.env.NANO_BANANA_API_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      `Please set these in your .env file or environment.`
    );
  }

  // Parse and validate NODE_ENV
  const nodeEnv = (process.env.NODE_ENV || 'development') as NodeEnv;
  if (!['development', 'testing', 'production'].includes(nodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV: ${nodeEnv}. Must be one of: development, testing, production`
    );
  }

  // Parse and validate LOG_LEVEL
  const logLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
  if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
    throw new Error(
      `Invalid LOG_LEVEL: ${logLevel}. Must be one of: debug, info, warn, error`
    );
  }

  // Parse port
  const portStr = process.env.PORT || '3001';
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${portStr}. Must be a number between 1 and 65535`);
  }

  // Frontend URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return {
    port,
    nodeEnv,
    supabase: {
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!,
      bucketName: process.env.SUPABASE_BUCKET_NAME!,
    },
    nanoBanana: {
      apiKey: process.env.NANO_BANANA_API_KEY!,
    },
    frontendUrl,
    logLevel,
  };
}

/**
 * Validate and get config once at startup
 */
let cachedConfig: Config | null = null;

export function initializeConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }
  cachedConfig = getConfig();
  return cachedConfig;
}

/**
 * Get cached config (must call initializeConfig first)
 */
export function getConfigSync(): Config {
  if (!cachedConfig) {
    throw new Error(
      'Config not initialized. Call initializeConfig() at startup first.'
    );
  }
  return cachedConfig;
}
