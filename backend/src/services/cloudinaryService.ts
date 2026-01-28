import cloudinary from '../config/cloudinary';
import env from '../config/env';
import { AppError } from '../utils/errors';

interface CloudinaryUploadResult {
  imageId: string;
  imageUrl: string;
}

export const uploadToCloudinary = (imageBuffer: Buffer): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: env.CLOUDINARY_FOLDER,
        resource_type: 'image'
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError('Cloud upload failed.', 502));
          return;
        }

        resolve({
          imageId: result.public_id,
          imageUrl: result.secure_url
        });
      }
    );

    uploadStream.end(imageBuffer);
  });
};

export const deleteFromCloudinary = async (imageId: string): Promise<void> => {
  const result = await cloudinary.uploader.destroy(imageId, {
    resource_type: 'image',
    invalidate: true
  });

  if (result.result === 'not found') {
    throw new AppError('Image not found.', 404);
  }

  if (result.result !== 'ok') {
    throw new AppError('Failed to delete image.', 502);
  }
};
