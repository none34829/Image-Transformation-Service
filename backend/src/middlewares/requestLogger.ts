import { randomUUID } from 'crypto';
import pinoHttp from 'pino-http';
import env from '../config/env';

export const requestLogger = pinoHttp({
  level: env.LOG_LEVEL,
  genReqId: () => randomUUID()
});
