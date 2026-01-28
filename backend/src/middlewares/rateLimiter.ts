import rateLimit from 'express-rate-limit';
import env from '../config/env';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Too many requests. Please try again later.'
  }
});
