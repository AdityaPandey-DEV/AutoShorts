import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

// Re-export AuthenticatedRequest for convenience
export type { AuthenticatedRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

interface JWTPayload {
  userId: number;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT authentication middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header missing' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Invalid authorization header format. Expected: Bearer <token>' });
      return;
    }

    const token = parts[1];
    
    try {
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }
      
      const decoded = jwt.verify(token, JWT_SECRET) as unknown as JWTPayload;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token expired' });
        return;
      }
      if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      throw err;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Generate a JWT token for a user
 * @param userId - User ID
 * @param email - User email (optional)
 * @param expiresIn - Token expiration time (default: 7d)
 * @returns JWT token string
 */
export function generateToken(userId: number, email?: string, expiresIn: string = '7d'): string {
  const payload: JWTPayload = {
    userId,
    email,
  };
  
  const secret = JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

