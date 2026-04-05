import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const fallbackAdminEmails = ['rhyssvv@gmail.com'];
const adminEmails = (process.env.ADMIN_EMAILS || fallbackAdminEmails.join(','))
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || (process.env.VERCEL ? 'https://pupy-v5.vercel.app/api' : 'http://localhost:3001'),
  frontendUrl: process.env.FRONTEND_URL || 'https://pupy-v5.vercel.app',
  supabase: {
    url: process.env.SUPABASE_URL || 'https://mpvlgtuexrvrmvaxhrgo.supabase.co',
    anonKey:
      process.env.SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdmxndHVleHJ2cm12YXhocmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjQ1NjQsImV4cCI6MjA5MDc0MDU2NH0.ytWdz5vL9ymP7qPue4XxoONKs6lCKkDOUcNs2hrcHl4',
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wdmxndHVleHJ2cm12YXhocmdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTE2NDU2NCwiZXhwIjoyMDkwNzQwNTY0fQ.qoe5awq8s9JRYBYIQpna8qa7P5V25uIsUQn2zdK95s0',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'pupy_jwt_secret_super_secret_key_2024',
    expiresIn: '7d',
  },
  googleAi: {
    apiKey: process.env.GOOGLE_AI_API_KEY || '',
  },
  logLevel: process.env.LOG_LEVEL || 'debug',
  cors: {
    origin: process.env.FRONTEND_URL || 'https://pupy-v5.vercel.app',
    credentials: true,
  },
  admin: {
    allowedEmails: adminEmails,
  },
};

export default config;
