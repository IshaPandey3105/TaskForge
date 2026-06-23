import { Router } from 'express';
import { userRolesEnum } from '../utils/constants.js';
import {
  validateProjectPermission,
  verifyJWT,
} from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router
  .route('/:projectId')
  .get(validateProjectPermission(AvailableUserRoles), getNotes)
  .post(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    notesValidator(),
    validate,
    createNote
  );

export default router;
