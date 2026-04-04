import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import errorHandler, { corsOptions } from './middleware/errorHandler.js';
import { pickLocaleText, resolveRequestLocale } from './utils/locale.js';

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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use((req, res, next) => {
  const language = resolveRequestLocale(req);
  res.setHeader('Content-Language', language);
  next();
});
app.use('/assets', express.static(path.resolve(__dirname, '../public/assets')));

app.get('/health', (req: Request, res: Response) => {
  const locale = resolveRequestLocale(req);

  res.json({
    success: true,
    message: pickLocaleText(locale, 'PUPY 后端运行正常。', 'PUPY backend is running normally.'),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    language: locale,
  });
});

app.get('/api/version', (req: Request, res: Response) => {
  const locale = resolveRequestLocale(req);

  res.json({
    success: true,
    version: '1.2.0',
    name: pickLocaleText(locale, 'PUPY 后端接口', 'PUPY Backend API'),
    description: pickLocaleText(locale, '宠物社交与数据管理平台后端', 'Backend for the pet social and data management platform'),
    language: locale,
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
  const locale = resolveRequestLocale(req);

  res.status(404).json({
    success: false,
    error: pickLocaleText(locale, '接口不存在。', 'Endpoint not found.'),
    code: 404,
    path: req.path,
    language: locale,
  });
});

app.use(errorHandler);

const PORT = config.port;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`PUPY backend started on http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/api/admin/panel`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Admin emails configured: ${config.admin.allowedEmails.length}`);
  });
}

export default app;