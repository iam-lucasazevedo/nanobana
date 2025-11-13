import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  validateEditRequest,
  validateImageFile,
  createEditRequest,
  ALLOWED_STYLES
} from '../models/editRequest.js';
import { nanoBananaService } from '../services/nanoBananaService.js';
import { sessionService } from '../services/sessionService.js';
import { editRepository } from '../models/editRepository.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { uploadMiddleware, validateUploadedFile, fileToBase64 } from '../utils/uploadHandler.js';
import { validateFiles } from '../utils/fileValidator.js';
import { EditImageResponse } from '../types/models.js';
import { supabaseStorageService } from '../services/supabaseStorage.js';

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
 * POST /api/edit
 * Upload images and create an edit task
 */
router.post(
  '/edit',
  uploadMiddleware.array('images', 10),
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

    // Get uploaded files
    const files = req.files as Express.Multer.File[];

    // Validate files exist
    if (!files || files.length === 0) {
      throw new AppError(400, 'No files uploaded', 'At least one image is required');
    }

    // Validate file count
    if (files.length > 10) {
      throw new AppError(
        400,
        'Too many files',
        `Maximum 10 images allowed. Got ${files.length}`
      );
    }

    // Validate each file
    const fileValidation = validateFiles(files, 10);
    if (!fileValidation.valid) {
      throw new AppError(400, 'Invalid files', fileValidation.errors.join('; '));
    }

    // Get edit parameters from form data
    const editPrompt = req.body.editPrompt as string;
    const style = (req.body.style as string) || 'default';
    const aspectRatio = (req.body.aspectRatio as string) || '1:1';

    // Validate edit request parameters
    const paramValidation = validateEditRequest({
      editPrompt,
      style,
      imageCount: files.length
    });

    if (!paramValidation.valid) {
      throw new AppError(
        400,
        'Invalid request parameters',
        paramValidation.errors.join('; ')
      );
    }

    // Upload files to Supabase Storage and get public URLs
    const imageUrls: string[] = [];

    try {
      // Upload all files to Supabase in parallel
      const uploadResults = await supabaseStorageService.uploadMultipleFilesToSupabase(files);

      // Validate each upload result
      for (const result of uploadResults) {
        if (!result.publicUrl) {
          throw new AppError(500, 'Upload failed', 'Failed to get public URL from Supabase');
        }
        imageUrls.push(result.publicUrl);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new AppError(500, 'Upload failed', msg);
    }

    // Create edit request record
    const requestId = uuidv4();
    const editReq = createEditRequest(requestId, sessionId, {
      editPrompt,
      style
    });

    // Store request in database
    await sessionService.addEditRequest(editReq);

    // Update session last active mode
    await sessionService.updatePreferences(sessionId, {
      last_active_mode: 'edit'
    });

    // Create task on Nano Banana API
    let taskId: string;
    try {
      // Pass public URLs of uploaded images to Nano Banana API
      const taskPayload = await nanoBananaService.createEditTask({
        imageUrls,
        editPrompt,
        style,
        aspectRatio
      });

      taskId = taskPayload.taskId;

      // Store task metadata for polling
      taskStore.set(taskId, {
        sessionId,
        requestId,
        status: 'pending'
      });

      // Note: Request starts as pending in the database via createEditRequest
    } catch (error) {
      // Mark request as failed
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await sessionService.updateEditStatus(requestId, 'failed', msg);
      throw error;
    }

    // Update session last access
    await sessionService.updateSessionLastAccess(sessionId);

    // Return response with taskId for polling
    const response: EditImageResponse = {
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
 * GET /api/edit/status
 * Poll edit task status and get results when ready
 */
router.get(
  '/edit/status',
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
        await sessionService.updateEditStatus(taskMeta.requestId, 'completed');

        // Update session last access
        await sessionService.updateSessionLastAccess(sessionId);

        const response: EditImageResponse = {
          requestId: taskMeta.requestId,
          status: 'completed',
          variants: statusResult.images,
          createdAt: new Date().toISOString()
        };

        res.json(response);
      } else if (statusResult.state === 'failed') {
        // Task failed
        taskMeta.status = 'failed';
        taskMeta.error = statusResult.error;

        // Update request status in database
        await sessionService.updateEditStatus(
          taskMeta.requestId,
          'failed',
          statusResult.error
        );

        const response: EditImageResponse = {
          requestId: taskMeta.requestId,
          status: 'failed',
          error: 'Edit failed',
          details: statusResult.error,
          createdAt: new Date().toISOString()
        };

        res.json(response);
      } else {
        // Still processing
        const response: EditImageResponse = {
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

      await sessionService.updateEditStatus(taskMeta.requestId, 'failed', msg);

      const response: EditImageResponse = {
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
 * GET /api/edit/options
 * Get available edit options (styles, aspect ratios)
 */
router.get(
  '/edit/options',
  asyncHandler(async (req: Request, res: Response) => {
    const options = nanoBananaService.getGenerationOptions();
    res.json({
      styles: options.styles,
      aspectRatios: options.aspectRatios
    });
  })
);

export default router;
