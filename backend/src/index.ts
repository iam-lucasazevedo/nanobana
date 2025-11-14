import express from 'express';
import dotenv from 'dotenv';
import { initializeConfig, getConfigSync } from './utils/config.js';
import { initializeLogger, getLogger } from './utils/logger.js';
import { initializeDatabase, closeDatabase } from './utils/db.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { sessionService } from './services/sessionService.js';
import generateRoute from './api/generateRoute.js';
import preferencesRoute from './api/preferencesRoute.js';
import editRoute from './api/editRoute.js';
import refineRoute from './api/refineRoute.js';

dotenv.config();

// Initialize configuration and logger early
let config: any;
let logger: any;

try {
  config = initializeConfig();
  logger = initializeLogger(config.logLevel);
} catch (error) {
  console.error('Failed to initialize configuration:', error);
  process.exit(1);
}

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime()
  });
});

// Session endpoints
app.post('/api/session', asyncHandler(async (req, res) => {
  const session = await sessionService.createSession();
  res.status(201).json({
    sessionId: session.session_id,
    createdAt: session.created_at
  });
}));

app.get('/api/session', asyncHandler(async (req, res) => {
  const sessionId = req.headers['x-session-id'] as string;
  if (!sessionId) {
    return res.status(400).json({
      error: 'Missing session',
      details: 'X-Session-ID header is required'
    });
  }

  const session = await sessionService.getFullSession(sessionId);
  if (!session) {
    return res.status(404).json({
      error: 'Session not found',
      details: 'Invalid or expired session ID'
    });
  }

  res.json(session);
}));

app.post('/api/session/preferences', asyncHandler(async (req, res) => {
  const sessionId = req.headers['x-session-id'] as string;
  if (!sessionId) {
    return res.status(400).json({
      error: 'Missing session',
      details: 'X-Session-ID header is required'
    });
  }

  const session = await sessionService.getSession(sessionId);
  if (!session) {
    return res.status(404).json({
      error: 'Session not found',
      details: 'Invalid or expired session ID'
    });
  }

  const updated = await sessionService.updatePreferences(sessionId, req.body);
  res.json({
    success: true,
    updated
  });
}));

// Register API routes
app.use('/api', generateRoute);
app.use('/api', preferencesRoute);
app.use('/api', editRoute);
app.use('/api', refineRoute);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server with async initialization
async function startServer() {
  try {
    // Log startup configuration
    logger.info('Application startup initiated', {
      nodeEnv: config.nodeEnv,
      port: config.port,
      logLevel: config.logLevel,
      frontendUrl: config.frontendUrl,
    });

    logger.info('Initializing Supabase database connection...');
    await initializeDatabase();
    logger.info('Supabase database connected successfully');

    // Validate Nano Banana API connectivity
    logger.info('Validating Nano Banana API connectivity...');
    if (!config.nanoBanana.apiKey) {
      throw new Error('NANO_BANANA_API_KEY is not configured');
    }
    logger.info('Nano Banana API key configured');

    const server = app.listen(config.port, () => {
      logger.info(`Express server listening on port ${config.port}`, {
        url: `http://localhost:${config.port}`,
        environment: config.nodeEnv,
        publicUrl: config.nodeEnv === 'production' ? 'https://render.deployment.url' : 'http://localhost'
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        await closeDatabase();
        logger.info('Server closed gracefully');
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error as Error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection', {
        errorMessage: String(reason),
        errorStack: reason instanceof Error ? reason.stack : undefined,
      });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

startServer();

export default app;
