/**
 * Structured logging utility for production and development
 * Outputs JSON-formatted logs suitable for Render's log streaming
 */

import { LogLevel } from './config.js';

export interface LogContext {
  [key: string]: string | number | boolean | undefined;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Log level hierarchy (lower index = higher priority)
 */
const LOG_HIERARCHY: LogLevel[] = ['error', 'warn', 'info', 'debug'];

class Logger {
  private currentLevel: LogLevel = 'info';

  constructor(initialLevel: LogLevel = 'info') {
    this.setLevel(initialLevel);
  }

  /**
   * Set the minimum log level to display
   */
  setLevel(level: LogLevel): void {
    if (!LOG_HIERARCHY.includes(level)) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.currentLevel = level;
  }

  /**
   * Check if a message at a given level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_HIERARCHY.indexOf(level) <= LOG_HIERARCHY.indexOf(this.currentLevel);
  }

  /**
   * Format and output a log entry
   */
  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Output as JSON for machine parsing, followed by text for humans
    const jsonOutput = JSON.stringify(entry);
    const humanOutput = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    const contextOutput = entry.context && Object.keys(entry.context).length > 0
      ? ` ${JSON.stringify(entry.context)}`
      : '';

    // Use console methods by level
    switch (entry.level) {
      case 'error':
        console.error(jsonOutput);
        break;
      case 'warn':
        console.warn(jsonOutput);
        break;
      case 'info':
      case 'debug':
        console.log(jsonOutput);
        break;
    }
  }

  /**
   * Log at debug level (detailed diagnostic information)
   */
  debug(message: string, context?: LogContext): void {
    this.output({
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      context,
    });
  }

  /**
   * Log at info level (informational messages)
   */
  info(message: string, context?: LogContext): void {
    this.output({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    });
  }

  /**
   * Log at warn level (warning messages for unexpected conditions)
   */
  warn(message: string, context?: LogContext): void {
    this.output({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    });
  }

  /**
   * Log at error level (error messages)
   */
  error(message: string, context?: LogContext | Error): void {
    let finalContext = context as LogContext | undefined;

    // If context is an Error, convert it to a context object
    if (context instanceof Error) {
      finalContext = {
        errorName: context.name,
        errorMessage: context.message,
        errorStack: context.stack,
      };
    }

    this.output({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context: finalContext,
    });
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null;

/**
 * Initialize the global logger with a specific level
 */
export function initializeLogger(level: LogLevel = 'info'): Logger {
  globalLogger = new Logger(level);
  return globalLogger;
}

/**
 * Get the global logger (initializes with 'info' level if not already initialized)
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger('info');
  }
  return globalLogger;
}

/**
 * Export singleton logger for convenience
 */
export const logger = getLogger();
