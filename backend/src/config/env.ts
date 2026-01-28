import dotenv from 'dotenv';

dotenv.config();

const requiredVars = [
  'REMOVE_BG_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const env = {
  PORT: parseNumber(process.env.PORT, 4000),
  REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY as string,
  REMOVE_BG_API_URL: process.env.REMOVE_BG_API_URL || 'https://api.remove.bg/v1.0/removebg',
  REMOVE_BG_TIMEOUT_MS: parseNumber(process.env.REMOVE_BG_TIMEOUT_MS, 30000),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'processed-images',
  MAX_FILE_SIZE: parseNumber(process.env.MAX_FILE_SIZE, 5 * 1024 * 1024),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  RATE_LIMIT_WINDOW_MS: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  RATE_LIMIT_MAX: parseNumber(process.env.RATE_LIMIT_MAX, 100),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

export default env;
