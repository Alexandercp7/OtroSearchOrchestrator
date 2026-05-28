import { NextFunction, Request, Response } from 'express';
import { JwtTokenGateway } from '../../infrastructure/security/JwtTokenGateway';

export interface AuthRequest extends Request {
  userId: string;
  userEmail: string;
}

export function makeAuthGuard(tokens: JwtTokenGateway) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'MISSING_TOKEN', message: 'Authorization header required' });
      return;
    }

    try {
      const payload = await tokens.verifyAccessToken(header.slice(7));
      (req as AuthRequest).userId    = payload.userId;
      (req as AuthRequest).userEmail = payload.email;
      next();
    } catch {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token is invalid or expired' });
    }
  };
}
