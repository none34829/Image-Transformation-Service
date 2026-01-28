import pino from 'pino';
import env from '../config/env';

const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]'
    ],
    remove: true
  }
});

export default logger;
