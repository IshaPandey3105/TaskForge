import mongoose from 'mongoose';
import { Project } from '../models/project.models.js';
import { ProjectMember } from '../models/projectmember.models.js';
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AvailableUserRoles, UserRolesEnum } from '../utils/constants.js';

const getProjects = asyncHandler(async (req, res) => {
  const memberships = await ProjectMember.find({
    user: req.user._id,
  });

  const projectIds = memberships.map((member) => member.project);

  const projects = await Project.find({
    _id: {
      $in: projectIds,
    },
  }).populate('createdBy', 'username fullName email avatar');

  return res
    .status(200)
    .json(new ApiResponse(200, projects, 'Projects fetched successfully'));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, 'Project fetched successfully'));
});

const createProject = asyncHandler(async (req, res) => {
  // Get data sent by frontend
  const { name, description } = req.body;

  // Validation: Project name is required
  if (!name?.trim()) {
    throw new ApiError(400, 'Project name is required');
  }

  const existingProject = await Project.findOne({
    name,
    createdBy: req.user._id,
  });

  if (existingProject) {
    throw new ApiError(409, 'Project with the same name already exists');
  }

  // Create the project and store the logged-in user as creator
  const project = await Project.create({
    name,
    description,
    createdBy: req.user._id,
  });

  // Add creator to ProjectMember collection
  // so that the creator automatically becomes ADMIN
  await ProjectMember.create({
    user: req.user._id,
    project: project._id,
    role: UserRolesEnum.ADMIN,
  });

  // Send success response
  return res
    .status(201)
    .json(new ApiResponse(201, project, 'Project created successfully'));
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { projectId } = req.params;

  const projectName = name.trim();

  // Check if another project with the same name
  // already exists for this user
  const existingProject = await Project.findOne({
    name: projectName,
    createdBy: req.user._id,
    _id: { $ne: projectId },
  });

  if (existingProject) {
    throw new ApiError(409, 'Project with the same name already exists');
  }

  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      name: projectName,
      description,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, 'Project updated successfully'));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findByIdAndDelete(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Delete all memberships belonging to this project only
  await ProjectMember.deleteMany({
    project: projectId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, project, 'Project deleted successfully'));
});

const addMemberToProject = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { projectId } = req.params;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, 'User does not exist');
  }

  const existingMember = await ProjectMember.findOne({
    user: user._id,
    project: projectId,
  });

  if (existingMember) {
    throw new ApiError(409, 'User is already a member of this project');
  }

  await ProjectMember.create({
    user: user._id,
    project: projectId,
    role,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, {}, 'Project member added successfully'));
});

const getProjectMembers = asyncHandler(async (req, res) => {
  // Get projectId from URL params
  const { projectId } = req.params;

  // Check if the project exists
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Find all members of this project
  const projectMembers = await ProjectMember.find({
    project: projectId,
  })
    // Replace the user ObjectId with user details
    .populate('user', 'username fullName email avatar')

    // Return only these fields and exclude _id
    .select('project user role createdAt updatedAt -_id');

  // Send response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMembers,
        'Project members fetched successfully'
      )
    );
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { newRole } = req.body;

  if (!AvailableUserRoles.includes(newRole)) {
    throw new ApiError(400, 'Invalid role');
  }

  let projectMember = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!projectMember) {
    throw new ApiError(404, 'Project member not found');
  }

  projectMember = await ProjectMember.findByIdAndUpdate(
    projectMember._id,
    {
      role: newRole,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!projectMember) {
    throw new ApiError(404, 'Project member not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMember,
        'Project member role updated successfully'
      )
    );
});

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;

  let projectMember = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!projectMember) {
    throw new ApiError(404, 'Project member not found');
  }

  // A global Admin can never be removed as a project member.
  const targetUser = await User.findById(userId).select('role');

  if (targetUser?.role === UserRolesEnum.ADMIN) {
    throw new ApiError(
      403,
      'Global admins cannot be removed from a project'
    );
  }

  projectMember = await ProjectMember.findByIdAndDelete(projectMember._id);

  if (!projectMember) {
    throw new ApiError(404, 'Project member not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, projectMember, 'Project member deleted successfully')
    );
});

export {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMemberToProject,
  getProjectMembers,
  updateMemberRole,
  deleteMember,
};
