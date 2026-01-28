import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AppError } from '../utils/errors';
import { removeBackground } from '../services/removeBgService';
import { flipImageHorizontally } from '../services/imageProcessingService';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService';

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    throw new AppError('No file uploaded.', 400);
  }

  const cleanedName = file.originalname || 'upload.png';

  const backgroundRemoved = await removeBackground(file.buffer, cleanedName, file.mimetype);
  const flippedImage = await flipImageHorizontally(backgroundRemoved);
  const uploaded = await uploadToCloudinary(flippedImage);

  res.status(200).json(uploaded);
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const imageId = decodeURIComponent(req.params.imageId || '').trim();

  if (!imageId) {
    throw new AppError('Image ID is required.', 400);
  }

  await deleteFromCloudinary(imageId);

  res.status(200).json({ success: true });
});
