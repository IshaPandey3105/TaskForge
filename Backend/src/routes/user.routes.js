import { Router } from 'express';
import {
  getAllUsers,
  updateProfileAvatar,
  deleteProfileAvatar,
  updateProfile,
} from '../controllers/user.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

// Any authenticated user may list teammates (identity fields only).
router.use(verifyJWT);

router.route('/').get(getAllUsers);

// Authenticated users may update their own profile picture.
router.route('/avatar').patch(upload.single('avatar'), updateProfileAvatar);

// Authenticated users may delete their own profile picture.
router.route('/avatar').delete(deleteProfileAvatar);

// Authenticated users may update their own profile details (name, username, email).
router.route('/profile').patch(updateProfile);

export default router;