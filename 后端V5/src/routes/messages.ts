import Express from 'express';
import { AuthRequest, authMiddleware } from '../middleware/authMiddleware.js';
import MessageService from '../services/messageService.js';
import { getPaginationParams } from '../utils/pagination.js';

const router = Express.Router();

router.post('/rooms', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const { user_b_id } = req.body;
    if (!user_b_id) {
      return res.status(400).json({ success: false, error: 'Missing user id.', code: 400 });
    }

    const result = await MessageService.getOrCreateChatRoom(req.user.user_id, user_b_id);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Create chat room error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/rooms', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const paginationParams = getPaginationParams(req.query);
    const result = await MessageService.getUserChatRooms(
      req.user.user_id,
      paginationParams.page,
      paginationParams.limit,
    );
    res.json(result);
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.post('/rooms/:chatRoomId/messages', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const { receiver_id, content } = req.body;
    if (!receiver_id || !content) {
      return res.status(400).json({ success: false, error: 'Missing required parameters.', code: 400 });
    }

    const result = await MessageService.sendMessage(
      req.params.chatRoomId,
      req.user.user_id,
      receiver_id,
      content,
    );
    res.status(result.success ? 201 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/rooms/:chatRoomId/messages', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const paginationParams = getPaginationParams(req.query);
    const result = await MessageService.getChatMessages(
      req.user.user_id,
      req.params.chatRoomId,
      paginationParams.page,
      paginationParams.limit,
    );
    res.status(result.success ? 200 : 403).json(result);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

export default router;
