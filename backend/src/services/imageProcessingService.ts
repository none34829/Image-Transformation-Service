import sharp from 'sharp';
import { AppError } from '../utils/errors';

export const flipImageHorizontally = async (imageBuffer: Buffer): Promise<Buffer> => {
  try {
    return await sharp(imageBuffer).flop().png().toBuffer();
  } catch (error) {
    throw new AppError('Image processing failed.', 500);
  }
};
