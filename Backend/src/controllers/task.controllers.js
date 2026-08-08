import mongoose from 'mongoose';
import { Project } from '../models/project.models.js';
import { Subtask } from '../models/subtask.models.js';
import { Task } from '../models/task.models.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { UserRolesEnum } from '../utils/constants.js';
import { ProjectMember } from '../models/projectmember.models.js';

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  const tasks = await Task.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate('assignedTo', 'username fullName avatar');

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, 'Tasks fetched successfully'));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  // assignedTo is now guaranteed to be a member of the project before the task is created.
  const assignedMember = await ProjectMember.findOne({
    user: assignedTo,
    project: projectId,
  });

  if (!assignedMember) {
    throw new ApiError(400, 'Assigned user is not a member of this project');
  }

  // Ensure req.files is an array or empty array if undefined
  const files = req.files || [];

  const attachments = files.map((file) => {
    return {
      url: `${process.env.SERVER_URL}/images/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
    };
  });

  const task = await Task.create({
    title,
    description,
    project: new mongoose.Types.ObjectId(projectId),
    assignedTo: assignedTo
      ? new mongoose.Types.ObjectId(assignedTo)
      : undefined,
    status,
    assignedBy: new mongoose.Types.ObjectId(req.user._id),
    attachments,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, 'Task created successfully'));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const task = await Task.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskId),
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignedTo',
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'subtasks',
        localField: '_id',
        foreignField: 'task',
        as: 'subtasks',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: '_id',
              as: 'createdBy',
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $arrayElemAt: ['$createdBy', 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ['$assignedTo', 0],
        },
      },
    },
  ]);

  if (!task || task.length === 0) {
    throw new ApiError(404, 'Task not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task[0], 'Task fetched successfully'));
});

const updateTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title, description, status, assignedTo } = req.body;

  const existingTask = await Task.findOne({
    _id: taskId,
    project: projectId,
  });

  if (!existingTask) {
    throw new ApiError(404, 'Task not found');
  }

  // Get existing attachments
  const existingAttachments = existingTask.attachments || [];

  // Get newly uploaded files
  const files = req.files || [];

  const newAttachments = files.map((file) => ({
    url: `${process.env.SERVER_URL}/images/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
  }));

  // Keep old + add new attachments
  const allAttachments = [...existingAttachments, ...newAttachments];

  const updateFields = {
    attachments: allAttachments,
    assignedBy: new mongoose.Types.ObjectId(req.user._id),
  };

  if (title !== undefined) {
    updateFields.title = title;
  }

  if (description !== undefined) {
    updateFields.description = description;
  }

  if (status !== undefined) {
    updateFields.status = status;
  }

  if (assignedTo !== undefined) {
    const assignedMember = await ProjectMember.findOne({
      user: assignedTo,
      project: projectId,
    });

    if (!assignedMember) {
      throw new ApiError(400, 'Assigned user is not a member of this project');
    }

    updateFields.assignedTo = new mongoose.Types.ObjectId(assignedTo);
  }

  const task = await Task.findOneAndUpdate(
    {
      _id: taskId,
      project: projectId,
    },
    updateFields,
    {
      new: true,
      runValidators: true,
    }
  ).populate('assignedTo', 'username fullName avatar');

  return res
    .status(200)
    .json(new ApiResponse(200, task, 'Task updated successfully'));
});

const deleteTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  const task = await Task.findOneAndDelete({
    _id: taskId,
    project: projectId,
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task, 'Task deleted successfully'));
});

const createSubTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title } = req.body;

  if (!title) {
    throw new ApiError(400, 'Title is required');
  }

  const task = await Task.findOne({
    _id: taskId,
    project: projectId,
  });
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const subTask = await Subtask.create({
    title,
    task: new mongoose.Types.ObjectId(taskId),
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, subTask, 'Sub task created successfully'));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;
  const { title, isCompleted } = req.body;

  const subTask = await Subtask.findById(subTaskId);

  if (!subTask) {
    throw new ApiError(404, 'Sub task not found');
  }

  // Find parent task and verify it belongs to this project
  const task = await Task.findOne({
    _id: subTask.task,
    project: projectId,
  });

  if (!task) {
    throw new ApiError(404, 'Sub task not found');
  }

  // Get user's role in this project
  const projectMember = await ProjectMember.findOne({
    user: req.user._id,
    project: projectId,
  });

  if (!projectMember) {
    throw new ApiError(403, 'User is not a member of this project');
  }

  const updateFields = {};

  if (
    [UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(
      projectMember.role
    )
  ) {
    if (title !== undefined) {
      updateFields.title = title;
    }
  }

  if (isCompleted !== undefined) {
    updateFields.isCompleted = isCompleted;
  }

  const updatedSubTask = await Subtask.findByIdAndUpdate(
    subTaskId,
    updateFields,
    {
      new: true,
      runValidators: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedSubTask, 'Sub task updated successfully')
    );
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;

  const subTask = await Subtask.findById(subTaskId);

  if (!subTask) {
    throw new ApiError(404, 'Sub task not found');
  }

  const task = await Task.findOne({
    _id: subTask.task,
    project: projectId,
  });

  if (!task) {
    throw new ApiError(404, 'Sub task not found');
  }

  await Subtask.findByIdAndDelete(subTaskId);

  return res
    .status(200)
    .json(new ApiResponse(200, subTask, 'Sub task deleted successfully'));
});

export {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
};
