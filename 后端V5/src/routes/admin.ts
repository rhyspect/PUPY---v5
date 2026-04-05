import Express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import { type AuthRequest, authMiddleware } from '../middleware/authMiddleware.js';
import AdminService from '../services/adminService.js';
import { getPaginationParams } from '../utils/pagination.js';
import { pickLocaleText, resolveRequestLocale } from '../utils/locale.js';

const router = Express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adminHtmlCandidates = [
  path.resolve(__dirname, '../public/admin-panel.html'),
  path.resolve(process.cwd(), 'src/public/admin-panel.html'),
  path.resolve(process.cwd(), 'dist/public/admin-panel.html'),
  path.resolve(process.cwd(), '../../后端V5/src/public/admin-panel.html'),
  path.resolve(process.cwd(), '../../后端V5/dist/public/admin-panel.html'),
];

const resolveAdminHtmlPath = () =>
  adminHtmlCandidates.find((candidate) => fs.existsSync(candidate)) || adminHtmlCandidates[0];

const ensureAdmin = (req: AuthRequest, res: Express.Response) => {
  const locale = resolveRequestLocale(req);
  const email = req.user?.email?.toLowerCase();

  if (!email) {
    res.status(401).json({
      success: false,
      error: pickLocaleText(locale, '尚未完成身份认证。', 'Authentication required.'),
      code: 401,
    });
    return false;
  }

  if (!config.admin.allowedEmails.includes(email)) {
    res.status(403).json({
      success: false,
      error: pickLocaleText(locale, '当前账号没有后台访问权限。', 'This account does not have admin access.'),
      code: 403,
    });
    return false;
  }

  return true;
};

const sendAdminError = (req: AuthRequest | Express.Request, res: Express.Response, error: unknown) => {
  const locale = resolveRequestLocale(req as Express.Request);
  console.error('Admin route error:', error);
  res.status(500).json({
    success: false,
    error: pickLocaleText(locale, '后台服务暂时不可用。', 'Admin service is temporarily unavailable.'),
    code: 500,
  });
};

router.get('/panel', (_req: Express.Request, res: Express.Response) => {
  res.sendFile(resolveAdminHtmlPath());
});

router.get('/overview', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const result = await AdminService.getOverview();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    sendAdminError(req, res, error);
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
    sendAdminError(req, res, error);
  }
});

router.patch('/users/:userId/verification', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const isVerified = Boolean(req.body?.is_verified);
    const result = await AdminService.updateUserVerification(req.params.userId, isVerified);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    sendAdminError(req, res, error);
  }
});

router.get('/pets', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { page, limit } = getPaginationParams(req.query);
    const result = await AdminService.getPets(page, limit);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    sendAdminError(req, res, error);
  }
});

router.get('/market', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { page, limit } = getPaginationParams(req.query);
    const result = await AdminService.getMarketProducts(page, limit);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    sendAdminError(req, res, error);
  }
});

router.get('/breeding', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const { page, limit } = getPaginationParams(req.query);
    const result = await AdminService.getBreedingRequests(page, limit);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    sendAdminError(req, res, error);
  }
});

export default router;
