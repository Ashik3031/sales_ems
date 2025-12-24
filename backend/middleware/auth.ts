import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { User as SchemaUser } from '@shared/schema';

declare global {
  namespace Express {
    interface User extends SchemaUser { }
  }
}


export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as { userId: string };
    const user = await storage.getUser(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (role: 'admin' | 'tl') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireTLOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (!['admin', 'tl'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  next();
};
