import { Router } from 'express';
import { upload } from '../middlewares/upload';
import { uploadImage, deleteImage } from '../controllers/imageController';

const router = Router();

router.post('/upload', upload.single('image'), uploadImage);
router.delete('/:imageId', deleteImage);

export default router;
