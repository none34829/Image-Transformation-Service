import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import logger from '../utils/logger';
import { AppError, isAppError } from '../utils/errors';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error.';

  if (error instanceof multer.MulterError) {
    statusCode = 400;
    if (error.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the allowed limit.';
    } else {
      message = error.message;
    }
  } else if (isAppError(error)) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.message.includes('CORS')) {
    statusCode = 403;
    message = 'CORS error: Origin not allowed.';
  }

  logger.error({ err: error }, 'Request failed');

  res.status(statusCode).json({
    error: true,
    message
  });
};
