/**
 * Prompt Enhancement Route
 * Handles POST /api/enhance requests for AI-powered prompt improvement
 */

import { Router, Request, Response, NextFunction } from 'express';
import { promptEnhancementService } from '../services/promptEnhancementService';
import { getErrorMessage } from '../utils/errorMessages';

// In-memory Map to track in-progress enhancement requests per session
// Prevents duplicate/concurrent enhancement requests from the same user
const enhancementInProgress = new Map<string, Promise<string>>();

const router = Router();

/**
 * POST /api/enhance
 * Enhance a user's prompt using the n8n AI agent
 *
 * Request Headers:
 *   X-Session-ID: required, UUID format
 *
 * Request Body:
 *   { "prompt": "user's prompt text" }
 *
 * Response on success (200):
 *   Plain text enhanced prompt
 *
 * Response on error:
 *   JSON error response with statusCode
 */
router.post('/enhance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract session ID from header
    const sessionId = req.headers['x-session-id'] as string;

    // Validate session header
    if (!sessionId) {
      const error = getErrorMessage('SESSION_HEADER_MISSING');
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        statusCode: error.statusCode
      });
    }

    // Extract prompt from request body
    const { prompt } = req.body;

    // Validate request body
    if (!prompt) {
      const error = getErrorMessage('ENHANCEMENT_PROMPT_EMPTY');
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        statusCode: error.statusCode
      });
    }

    // Check if enhancement is already in progress for this session
    const existingPromise = enhancementInProgress.get(sessionId);
    if (existingPromise) {
      // Check if the promise is still pending
      let isPending = false;
      existingPromise.then(
        () => { isPending = false; },
        () => { isPending = false; }
      );

      // Give it a tiny moment to resolve if it's about to
      await new Promise(resolve => setTimeout(resolve, 1));

      if (isPending || enhancementInProgress.has(sessionId)) {
        const error = getErrorMessage('ENHANCEMENT_IN_PROGRESS');
        return res.status(error.statusCode).json({
          error: error.code,
          message: error.message,
          statusCode: error.statusCode
        });
      }
    }

    // Create the enhancement promise and store it
    const enhancementPromise = promptEnhancementService.enhancePrompt(prompt);
    enhancementInProgress.set(sessionId, enhancementPromise);

    try {
      // Call the enhancement service
      const enhancedPrompt = await enhancementPromise;

      // Clean up the in-progress tracking
      enhancementInProgress.delete(sessionId);

      // Return the enhanced prompt as plain text
      res.status(200).type('text/plain').send(enhancedPrompt);
    } catch (serviceError) {
      // Clean up the in-progress tracking
      enhancementInProgress.delete(sessionId);

      // Handle service errors
      const statusCode = (serviceError as any).statusCode || 500;
      const errorCode = (serviceError as any).code || 'ENHANCEMENT_ERROR';
      const errorMessage = (serviceError as any).message || 'Enhancement failed';

      res.status(statusCode).json({
        error: errorCode,
        message: errorMessage,
        statusCode
      });
    }
  } catch (error) {
    // Handle unexpected errors
    const serverError = getErrorMessage('INTERNAL_SERVER_ERROR');
    res.status(serverError.statusCode).json({
      error: serverError.code,
      message: serverError.message,
      statusCode: serverError.statusCode
    });
  }
});

export default router;
