import Express from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/authMiddleware.js';
import AppDataService from '../services/appDataService.js';

const router = Express.Router();

router.get('/member-assets', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await AppDataService.getMemberAssets(req.user.user_id, req.user.email, req.user.username);
    res.status(result.success ? 200 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Get app member assets error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.post('/market-orders', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await AppDataService.createMarketOrder(req.user.user_id, req.user.email, req.user.username, req.body || {});
    res.status(result.success ? 201 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Create app market order error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.post('/care-bookings', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await AppDataService.createCareBooking(req.user.user_id, req.user.email, req.user.username, req.body || {});
    res.status(result.success ? 201 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Create app care booking error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.post('/walk-orders', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await AppDataService.createWalkOrder(req.user.user_id, req.user.email, req.user.username, req.body || {});
    res.status(result.success ? 201 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Create app walk order error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/chat-sessions', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const requestedType = req.query.type === 'pet' ? 'pet' : 'owner';
    const result = await AppDataService.getChatSessions(req.user.user_id, req.user.email, req.user.username, requestedType);
    res.status(result.success ? 200 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Get app chat sessions error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.post('/chat-sessions/ensure-owner', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await AppDataService.ensureOwnerSession(req.user.user_id, req.user.email, req.user.username, req.body || {});
    res.status(result.success ? 201 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Ensure owner chat session error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/chat-sessions/:sessionId', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await AppDataService.getChatSession(req.user.user_id, req.user.email, req.user.username, req.params.sessionId);
    res.status(result.success ? 200 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Get app chat session detail error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.post('/chat-sessions/:sessionId/messages', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await AppDataService.appendChatMessage(
      req.user.user_id,
      req.user.email,
      req.user.username,
      req.params.sessionId,
      req.body || {},
    );
    res.status(result.success ? 201 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Append app chat message error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

export default router;
