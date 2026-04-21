import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.warn('[auth] JWT_SECRET not set — all authenticated routes will reject requests until configured');
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!SECRET) {
    res.status(500).json({ error: 'Server auth not configured (JWT_SECRET missing)' });
    return;
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const decoded = jwt.verify(token, SECRET) as { sub: string };
    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
