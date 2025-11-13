import { Router, Request, Response } from 'express';
import { sessionService } from '../services/sessionService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { nanoBananaService } from '../services/nanoBananaService.js';

const router = Router();

/**
 * GET /api/preferences
 * Get generation options (sizes, styles, aspect ratios)
 */
router.get(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const options = nanoBananaService.getGenerationOptions();
    res.json(options);
  })
);

/**
 * POST /api/preferences
 * Update user preferences (called from T028 endpoint)
 */
router.post(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      throw new AppError(400, 'Missing session', 'X-Session-ID header is required');
    }

    const session = sessionService.getSession(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found', 'Invalid or expired session ID');
    }

    // Update preferences
    const updated = sessionService.updatePreferences(sessionId, req.body);

    sessionService.updateSessionLastAccess(sessionId);

    res.json({
      success: true,
      updated
    });
  })
);

export default router;
