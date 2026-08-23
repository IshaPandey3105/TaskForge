import { Router } from 'express';
import { getAllUsers } from '../controllers/user.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Any authenticated user may list teammates (identity fields only).
router.use(verifyJWT);

router.route('/').get(getAllUsers);

export default router;