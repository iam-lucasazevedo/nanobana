import { Router, Request, Response } from 'express';
import { nanoBananaService } from '../services/nanoBananaService.js';
import { sessionService } from '../services/sessionService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { EditImageResponse } from '../types/models.js';
import { supabaseStorageService } from '../services/supabaseStorage.js';
import axios from 'axios';

const router = Router();

// Store task metadata for polling
const taskStore = new Map<string, {
  sessionId: string;
  status: string;
  images?: any[];
  error?: string;
}>();

/**
 * POST /api/refine
 * Refine a generated image from URL
 */
router.post(
  '/refine',
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

    // Get parameters from request body
    const { imageUrl, editPrompt, style = 'default', aspectRatio = '1:1' } = req.body;

    // Validate required parameters
    if (!imageUrl) {
      throw new AppError(400, 'Missing imageUrl', 'Image URL is required');
    }
    if (!editPrompt) {
      throw new AppError(400, 'Missing editPrompt', 'Edit prompt is required');
    }

    try {
      console.log('Fetching image from URL:', imageUrl);

      // Fetch the image from URL
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      console.log('Image fetched successfully, size:', imageResponse.data.length);
      const imageBuffer = Buffer.from(imageResponse.data);

      // Create a mock file object for Supabase upload
      const mockFile = {
        buffer: imageBuffer,
        originalname: `refinement-${Date.now()}.png`,
        mimetype: 'image/png',
        size: imageBuffer.length
      } as any;

      // Upload image buffer to Supabase Storage
      console.log('Uploading image to Supabase...');
      const uploadResult = await supabaseStorageService.uploadFileToSupabase(mockFile);

      if (!uploadResult.publicUrl) {
        throw new Error('Failed to get public URL from Supabase');
      }

      console.log('Image uploaded to Supabase:', uploadResult.publicUrl);

      // Create edit task on Nano Banana API with Supabase URL
      const taskPayload = await nanoBananaService.createEditTask({
        imageUrls: [uploadResult.publicUrl],
        editPrompt,
        style,
        aspectRatio
      });

      const taskId = taskPayload.taskId;

      // Store task metadata for polling
      taskStore.set(taskId, {
        sessionId,
        status: 'pending'
      });

      // Update session last access
      await sessionService.updateSessionLastAccess(sessionId);

      // Return response with taskId for polling
      const response: EditImageResponse = {
        requestId: 'refine-' + taskId,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      res.json({
        ...response,
        taskId // Add taskId for frontend polling
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Refinement error:', error);
      console.error('Error message:', msg);
      if (msg.includes('404') || msg.includes('403') || msg.includes('CORS')) {
        throw new AppError(400, 'Invalid image URL', 'Could not fetch image from URL: ' + msg);
      }
      throw new AppError(500, 'Refinement failed', msg);
    }
  })
);

/**
 * GET /api/refine/status
 * Poll refine task status and get results when ready
 */
router.get(
  '/refine/status',
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
        // Task complete, update metadata and return images
        taskMeta.status = 'completed';
        taskMeta.images = statusResult.images;

        // Update session last access
        await sessionService.updateSessionLastAccess(sessionId);

        const response: EditImageResponse = {
          requestId: 'refine-' + taskId,
          status: 'completed',
          variants: statusResult.images,
          createdAt: new Date().toISOString()
        };

        res.json(response);
      } else if (statusResult.state === 'failed') {
        // Task failed
        taskMeta.status = 'failed';
        taskMeta.error = statusResult.error;

        const response: EditImageResponse = {
          requestId: 'refine-' + taskId,
          status: 'failed',
          error: 'Refinement failed',
          details: statusResult.error,
          createdAt: new Date().toISOString()
        };

        res.json(response);
      } else {
        // Still processing
        const response: EditImageResponse = {
          requestId: 'refine-' + taskId,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        res.json({
          ...response,
          taskState: statusResult.state
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      taskMeta.status = 'failed';
      taskMeta.error = msg;

      const response: EditImageResponse = {
        requestId: 'refine-' + taskId,
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
 * POST /api/download-image
 * Download an image from a URL (handles CORS)
 */
router.post(
  '/download-image',
  asyncHandler(async (req: Request, res: Response) => {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      throw new AppError(400, 'Missing imageUrl', 'Image URL is required');
    }

    try {
      console.log('Downloading image from URL:', imageUrl);

      // Fetch the image from URL
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Get the image buffer
      const imageBuffer = Buffer.from(imageResponse.data);

      // Set response headers for download
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', imageBuffer.length);
      res.setHeader('Content-Disposition', 'attachment; filename="image.png"');

      // Send the image buffer
      res.send(imageBuffer);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Download error:', error);
      throw new AppError(500, 'Download failed', msg);
    }
  })
);

export default router;
