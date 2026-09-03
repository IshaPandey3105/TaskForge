import { User } from '../models/user.models.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * @description Get all registered users for member selection.
 * Returns ONLY non-sensitive identity fields (id, fullName, username, email).
 * Passwords, tokens and any other sensitive fields are never exposed.
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('fullName username email role')
    .sort({ fullName: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, users, 'Users fetched successfully'));
});

/**
 * @description Update the authenticated user's profile picture.
 * Uses the shared multer upload (public/images) and stores the served URL
 * plus the local path on the user document. Sensitive credentials are
 * never touched — only the avatar field is updated.
 */
const updateProfileAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a profile picture');
  }

  const avatarUrl = `${process.env.SERVER_URL}/images/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: {
        url: avatarUrl,
        localpath: req.file.path,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select(
    '-password -refreshToken -emailVerificationToken -emailVerificationExpiry'
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Profile picture updated successfully'));
});

export { getAllUsers, updateProfileAvatar };