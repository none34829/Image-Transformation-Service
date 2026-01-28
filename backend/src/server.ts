import express from 'express';
import env from './config/env';
import { corsMiddleware } from './middlewares/corsMiddleware';
import { rateLimiter } from './middlewares/rateLimiter';
import { requestLogger } from './middlewares/requestLogger';
import imageRoutes from './routes/imageRoutes';
import { errorHandler } from './middlewares/errorHandler';
import logger from './utils/logger';

const app = express();

app.use(requestLogger);
app.use(corsMiddleware);
app.use(rateLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/images', imageRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: true, message: 'Route not found.' });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});
