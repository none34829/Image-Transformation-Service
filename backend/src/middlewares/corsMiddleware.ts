import cors, { CorsOptions } from 'cors';
import env from '../config/env';

const origins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (origins.includes('*') || origins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: false
};

export const corsMiddleware = cors(corsOptions);
