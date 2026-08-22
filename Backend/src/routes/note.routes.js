import { Router } from 'express';
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from '../controllers/note.controllers.js';
import {
  validateProjectPermission,
  verifyJWT,
} from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { AvailableUserRoles, UserRolesEnum } from '../utils/constants.js';
import { notesValidator } from '../validators/val.js';

const router = Router();

router.use(verifyJWT);

router
  .route('/:projectId')
  .get(validateProjectPermission(AvailableUserRoles), getNotes)
  .post(
    // Members may create notes in projects they belong to;
    // edit/delete remain restricted to ADMIN / PROJECT_ADMIN below.
    validateProjectPermission(AvailableUserRoles),
    notesValidator(),
    validate,
    createNote
  );

router
  .route('/:projectId/n/:noteId')
  .get(validateProjectPermission(AvailableUserRoles), getNoteById)
  .put(
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    notesValidator(),
    validate,
    updateNote
  )
  .delete(validateProjectPermission([
    UserRolesEnum.ADMIN,
    UserRolesEnum.PROJECT_ADMIN,
  ]), deleteNote);

export default router;
