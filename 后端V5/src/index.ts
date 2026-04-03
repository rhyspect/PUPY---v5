import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import config from './config/index.js';
import errorHandler, { corsOptions } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import petRoutes from './routes/pets.js';
import matchRoutes from './routes/matches.js';
import messageRoutes from './routes/messages.js';
import diaryRoutes from './routes/diaries.js';
import marketRoutes from './routes/market.js';
import breedingRoutes from './routes/breeding.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';

const app: Express = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use((req, res, next) => {
  const acceptLanguage = req.headers['accept-language'];
  const language = typeof acceptLanguage === 'string' && acceptLanguage.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
  res.setHeader('Content-Language', language);
  next();
});
app.use('/assets', express.static(path.resolve(process.cwd(), 'src/public/assets')));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'PUPY 后端运行正常。',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

app.get('/api/version', (_req: Request, res: Response) => {
  res.json({
    success: true,
    version: '1.2.0',
    name: 'PUPY 后端接口',
    description: '宠物社交与数据管理平台后端',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/diaries', diaryRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/breeding', breedingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '接口不存在。',
    code: 404,
    path: req.path,
  });
});

app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`PUPY backend started on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/api/admin/panel`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Admin emails configured: ${config.admin.allowedEmails.length}`);
});

export default app;
