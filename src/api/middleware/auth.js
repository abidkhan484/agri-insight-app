import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

/**
 * JWT authentication middleware.
 * Protects routes by verifying the Bearer token in the Authorization header.
 *
 * Passes the decoded payload as `req.user` on success.
 * Responds with 401 if the token is missing, invalid, or expired.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Auth middleware: missing or malformed Authorization header', {
      path: req.url,
    });
    res.json(401, { error: 'Unauthorized: missing token' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = jwt.verify(token, config.supabaseJwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Auth middleware: invalid or expired token', {
      path: req.url,
      error: err.message,
    });
    res.json(401, { error: 'Unauthorized: invalid or expired token' });
  }
}
