import path from 'path';
import { AppError } from './errors';

export const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp'
]);

export const ALLOWED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp'
]);

export const BLOCKED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.dll',
  '.js',
  '.jar'
]);

export const validateUploadFile = (file: Express.Multer.File): void => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (BLOCKED_EXTENSIONS.has(extension)) {
    throw new AppError('Executable files are not allowed.', 400);
  }

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new AppError('Unsupported file extension.', 400);
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new AppError('Unsupported file type.', 400);
  }
};
