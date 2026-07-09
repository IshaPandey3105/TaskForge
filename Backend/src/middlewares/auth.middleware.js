import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ProjectMember } from '../models/projectmember.model.js';
import mongoose from 'mongoose';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // JWT can come either from cookies or Authorization header
  const token =
    req.cookies?.accessToken ||
    req.header('Authorization')?.replace('Bearer ', '');

  // If token is missing, user is not logged in
  if (!token) {
    throw new ApiError(401, 'Unauthorized request');
  }

  try {
    // Verify JWT using secret key
    // Returns payload stored inside token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find user using _id from decoded token
    // Exclude sensitive fields from result
    const user = await User.findById(decodedToken?._id).select(
      '-password -refreshToken -emailVerificationToken -emailVerificationExpiry'
    );

    // Token is valid but user doesn't exist in DB
    if (!user) {
      throw new ApiError(401, 'Invalid access token');
    }

    // Attach authenticated user to req.user
    // Accessible in next middleware/controller
    req.user = user;

    // Pass control to next middleware/controller
    next();
  } catch (error) {
    // Token invalid / expired / tampered
    throw new ApiError(401, error?.message || 'Invalid access token');
  }
});

//getLoggedInUserOrIgnore() tries to authenticate the user using JWT.( Public routes)
// If authentication succeeds, it stores the user in req.user;
// otherwise, it silently ignores the error and allows the request to continue.
export const getLoggedInUserOrIgnore = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header('Authorization')?.replace('Bearer ', '');

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      '-password -refreshToken -emailVerificationToken -emailVerificationExpiry'
    );
    req.user = user;
    next();
  } catch (error) {
    // Fail silently with req.user being falsy
    next();
  }
});

//validateProjectPermission() authorizes a user by checking whether their project role matches the allowed roles for that route.

export const validateProjectPermission = (roles = []) =>
  asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    if (!projectId) {
      throw new ApiError(400, 'Project id is missing');
    }

    const project = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId), // for minimizing datatype error
      user: new mongoose.Types.ObjectId(req.User._id), 
    });

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const givenRole = project?.role;

    req.user.role = givenRole;

    // roles → Roles allowed to access the route.

    // givenRole → Role of the currently logged-in user in that project.

    if (!roles.includes(givenRole)) {
      throw new ApiError(
        403,
        'You do not have permission to perform this action'
      );
    }

    next();
  });
