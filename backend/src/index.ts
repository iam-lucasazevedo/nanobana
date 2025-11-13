import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initializeDatabase, closeDatabase } from './utils/db.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { sessionService } from './services/sessionService.js';
import generateRoute from './api/generateRoute.js';
import preferencesRoute from './api/preferencesRoute.js';
import editRoute from './api/editRoute.js';
import refineRoute from './api/refineRoute.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images as static files
app.use('/api/uploads', express.static('./data/uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized');

    const server = app.listen(PORT, () => {
      console.log(`Express server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await closeDatabase();
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
