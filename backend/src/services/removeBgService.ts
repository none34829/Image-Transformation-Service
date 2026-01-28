import axios from 'axios';
import FormData from 'form-data';
import env from '../config/env';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';

export const removeBackground = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<Buffer> => {
  const form = new FormData();
  form.append('image_file', fileBuffer, { filename: fileName, contentType: mimeType });

  const startTime = Date.now();

  try {
    const response = await axios.post(env.REMOVE_BG_API_URL, form, {
      headers: {
        ...form.getHeaders(),
        'X-Api-Key': env.REMOVE_BG_API_KEY
      },
      responseType: 'arraybuffer',
      timeout: env.REMOVE_BG_TIMEOUT_MS,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: (status) => status >= 200 && status < 300
    });

    const latencyMs = Date.now() - startTime;
    logger.info({ latencyMs }, 'Background removal completed');

    return Buffer.from(response.data);
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    logger.error({ err: error, latencyMs }, 'Background removal failed');

    if (axios.isAxiosError(error) && error.response) {
      let message = 'Background removal failed.';
      const contentType = error.response.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        try {
          const parsed = JSON.parse(Buffer.from(error.response.data).toString('utf8'));
          message = parsed?.errors?.[0]?.title || parsed?.errors?.[0]?.detail || message;
        } catch {
          // Ignore JSON parse errors.
        }
      }

      throw new AppError(message, 502);
    }

    throw new AppError('Background removal failed.', 502);
  }
};
