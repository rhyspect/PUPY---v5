import type { NextFunction, Request, Response } from 'express';
import AuthService from '../services/authService.js';
import type { JWTPayload } from '../types/index.js';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token is missing.',
        code: 401,
      });
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token is invalid.',
        code: 401,
      });
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Authentication failed.',
      code: 401,
    });
  }
};

export default authMiddleware;
