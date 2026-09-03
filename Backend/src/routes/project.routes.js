import { Router } from 'express';
import {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberRole,
  updateProject,
} from '../controllers/project.controllers.js';
import {
  validateProjectPermission,
  validateRemoveMemberPermission,
  verifyJWT,
} from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { AvailableUserRoles, UserRolesEnum } from '../utils/constants.js';
import {
  addMemberToProjectValidator,
  createProjectValidator,
} from '../validators/val.js';

const router = Router();

router.use(verifyJWT);

router
  .route('/')
  .get(getProjects)
  .post(createProjectValidator(), validate, createProject);

router
  .route('/:projectId')
  .get(validateProjectPermission(AvailableUserRoles), getProjectById)
  .put(
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    createProjectValidator(),
    validate,
    updateProject
  )
  .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProject);

router
  .route('/:projectId/members')
  .get(getProjectMembers)
  .post(
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    addMemberToProjectValidator(),
    validate,
    addMemberToProject
  );

router
  .route('/:projectId/members/:userId')
  .put(
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    updateMemberRole
  )
  .delete(validateRemoveMemberPermission, deleteMember);

export default router;
