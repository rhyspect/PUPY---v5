import Express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import { AuthRequest, authMiddleware } from '../middleware/authMiddleware.js';
import AdminService from '../services/adminService.js';
import { getPaginationParams } from '../utils/pagination.js';

const router = Express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminHtmlPath = path.resolve(__dirname, '../public/admin-panel.html');

const ensureAdmin = (req: AuthRequest, res: Express.Response) => {
  const email = req.user?.email?.toLowerCase();
  if (!email) {
    res.status(401).json({ success: false, error: '未认证', code: 401 });
    return false;
  }

  if (!config.admin.allowedEmails.includes(email)) {
    res.status(403).json({ success: false, error: '当前账号不在 ADMIN_EMAILS 白名单中', code: 403 });
    return false;
  }

  return true;
};

router.get('/panel', (_req: Express.Request, res: Express.Response) => {
  res.sendFile(adminHtmlPath);
});

router.get('/overview', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const result = await AdminService.getOverview();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ success: false, error: '服务器错误', code: 500 });
  }
});

router.get('/users', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { page, limit } = getPaginationParams(req.query);
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : '';
    const result = await AdminService.getUsers(page, limit, keyword);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, error: '服务器错误', code: 500 });
  }
});

router.patch('/users/:userId/verification', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const isVerified = Boolean(req.body?.is_verified);
    const result = await AdminService.updateUserVerification(req.params.userId, isVerified);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Admin verify user error:', error);
    res.status(500).json({ success: false, error: '服务器错误', code: 500 });
  }
});

router.get('/pets', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { page, limit } = getPaginationParams(req.query);
    const result = await AdminService.getPets(page, limit);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Admin pets error:', error);
    res.status(500).json({ success: false, error: '服务器错误', code: 500 });
  }
});

router.get('/market', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { page, limit } = getPaginationParams(req.query);
    const result = await AdminService.getMarketProducts(page, limit);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Admin market error:', error);
    res.status(500).json({ success: false, error: '服务器错误', code: 500 });
  }
});

router.get('/breeding', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { page, limit } = getPaginationParams(req.query);
    const result = await AdminService.getBreedingRequests(page, limit);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Admin breeding error:', error);
    res.status(500).json({ success: false, error: '服务器错误', code: 500 });
  }
});

export default router;