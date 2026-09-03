import { Router } from 'express';
import {
  getAllUsers,
  updateProfileAvatar,
} from '../controllers/user.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

// Any authenticated user may list teammates (identity fields only).
router.use(verifyJWT);

router.route('/').get(getAllUsers);

// Authenticated users may update their own profile picture.
router.route('/avatar').patch(upload.single('avatar'), updateProfileAvatar);

export default router;