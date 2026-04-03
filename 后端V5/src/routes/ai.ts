import Express from 'express';
import { AuthRequest, authMiddleware } from '../middleware/authMiddleware.js';
import AiService from '../services/aiService.js';

const router = Express.Router();

router.post('/prayer', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const { pet_id, prayer_text } = req.body;
    if (!pet_id || !prayer_text) {
      return res.status(400).json({ success: false, error: 'Missing required parameters.', code: 400 });
    }

    const aiResponse = await AiService.generateAIResponse('Pet', prayer_text, 'friendly');
    if (!aiResponse.success) {
      return res.status(500).json(aiResponse);
    }

    const result = await AiService.createPrayerRecord(
      req.user.user_id,
      pet_id,
      prayer_text,
      aiResponse.data?.response || '',
      aiResponse.data?.sentiment || 'neutral',
    );

    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Create prayer error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/prayer', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await AiService.getUserPrayerRecords(req.user.user_id);
    res.json(result);
  } catch (error) {
    console.error('Get prayer records error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/notifications', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await AiService.getUnreadNotifications(req.user.user_id);
    res.json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.patch('/notifications/:notificationId', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await AiService.markNotificationAsRead(req.user.user_id, req.params.notificationId);
    res.json(result);
  } catch (error) {
    console.error('Mark notification error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

export default router;
