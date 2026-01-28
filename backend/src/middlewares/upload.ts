import multer from 'multer';
import env from '../config/env';
import { validateUploadFile } from '../utils/fileValidation';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  try {
    validateUploadFile(file);
    cb(null, true);
  } catch (error) {
    cb(error as Error);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter
});
