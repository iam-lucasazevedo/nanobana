import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  validateGenerationRequest,
  createGenerationRequest
} from '../models/generationRequest.js';
import { nanoBananaService } from '../services/nanoBananaService.js';
import { sessionService } from '../services/sessionService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { GenerateImageResponse } from '../types/models.js';

const router = Router();

// Store task metadata for polling (in production, use database or Redis)
const taskStore = new Map<string, {
  sessionId: string;
  requestId: string;
  status: string;
  images?: any[];
  error?: string;
}>();

/**
 * POST /api/generate
 * Create a generation task and return taskId for polling
 */
router.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response) => {
    // Get session ID from header
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      throw new AppError(400, 'Missing session', 'X-Session-ID header is required');
    }

    // Validate session exists
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'Invalid or expired session ID');
    }

    // Validate request payload
    const validation = validateGenerationRequest(req.body);
    if (!validation.valid) {
      throw new AppError(
        400,
        'Invalid request',
        validation.errors.join('; ')
      );
    }

    // Create generation request record
    const requestId = uuidv4();
    const generationReq = createGenerationRequest(
      requestId,
      sessionId,
      req.body
    );

    // Store request in database
    await sessionService.addGenerationRequest(generationReq);

    // Update session last active mode and preferences
    await sessionService.updatePreferences(sessionId, {
      preferred_size: req.body.size || '1024x768',
      preferred_style: req.body.style || 'default',
      preferred_aspect_ratio: req.body.aspectRatio || '16:9',
      last_active_mode: 'generation'
    });

    // Create task on Nano Banana API
    let taskId: string;
    try {
      const taskPayload = await nanoBananaService.createGenerationTask({
        prompt: req.body.prompt,
        model: req.body.model,
        size: req.body.size,
        style: req.body.style,
        aspectRatio: req.body.aspectRatio
      });

      taskId = taskPayload.taskId;

      // Store task metadata for polling
      taskStore.set(taskId, {
        sessionId,
        requestId,
        status: 'pending'
      });

      // Mark request as pending
      await sessionService.updateGenerationStatus(requestId, 'pending');
    } catch (error) {
      // Mark request as failed
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await sessionService.updateGenerationStatus(requestId, 'failed', msg);
      throw error;
    }

    // Update session last access
    await sessionService.updateSessionLastAccess(sessionId);

    // Return response with taskId for polling
    const response: GenerateImageResponse = {
      requestId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    res.json({
      ...response,
      taskId // Add taskId for frontend polling
    });
  })
);

/**
 * GET /api/generate/status
 * Poll task status and get results when ready
 */
router.get(
  '/generate/status',
  asyncHandler(async (req: Request, res: Response) => {
    const taskId = req.query.taskId as string;
    if (!taskId) {
      throw new AppError(400, 'Missing taskId', 'taskId query parameter is required');
    }

    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      throw new AppError(400, 'Missing session', 'X-Session-ID header is required');
    }

    // Validate session exists
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'Invalid or expired session ID');
    }

    // Get stored task metadata
    const taskMeta = taskStore.get(taskId);
    if (!taskMeta) {
      throw new AppError(404, 'Task not found', 'Invalid or expired taskId');
    }

    // Verify task belongs to this session
    if (taskMeta.sessionId !== sessionId) {
      throw new AppError(403, 'Forbidden', 'Task does not belong to this session');
    }

    try {
      // Check task status on Nano Banana API
      const statusResult = await nanoBananaService.checkTaskStatus(taskId);

      if (statusResult.state === 'success' && statusResult.images) {
        // Task complete, update database and return images
        taskMeta.status = 'completed';
        taskMeta.images = statusResult.images;

        // Update request status in database
        await sessionService.updateGenerationStatus(taskMeta.requestId, 'completed');

        // Update session last access
        await sessionService.updateSessionLastAccess(sessionId);

        const response: GenerateImageResponse = {
          requestId: taskMeta.requestId,
          status: 'completed',
          images: statusResult.images,
          createdAt: new Date().toISOString()
        };

        res.json(response);
      } else if (statusResult.state === 'failed') {
        // Task failed
        taskMeta.status = 'failed';
        taskMeta.error = statusResult.error;

        // Update request status in database
        await sessionService.updateGenerationStatus(
          taskMeta.requestId,
          'failed',
          statusResult.error
        );

        const response: GenerateImageResponse = {
          requestId: taskMeta.requestId,
          status: 'failed',
          error: 'Generation failed',
          details: statusResult.error,
          createdAt: new Date().toISOString()
        };

        res.json(response);
      } else {
        // Still processing
        const response: GenerateImageResponse = {
          requestId: taskMeta.requestId,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        res.json({
          ...response,
          taskState: statusResult.state // Include current state for UI feedback
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      taskMeta.status = 'failed';
      taskMeta.error = msg;

      await sessionService.updateGenerationStatus(taskMeta.requestId, 'failed', msg);

      const response: GenerateImageResponse = {
        requestId: taskMeta.requestId,
        status: 'failed',
        error: 'Status check failed',
        details: msg,
        createdAt: new Date().toISOString()
      };

      res.json(response);
    }
  })
);

/**
 * GET /api/generate/options
 * Get available generation options (sizes, styles, aspect ratios)
 */
router.get(
  '/generate/options',
  asyncHandler(async (req: Request, res: Response) => {
    const options = nanoBananaService.getGenerationOptions();
    res.json(options);
  })
);

export default router;
