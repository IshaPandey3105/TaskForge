import { User } from '../models/user.models.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { uploadBufferOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

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
 * Flow: Multer (memoryStorage) -> Cloudinary -> MongoDB.
 * The old Cloudinary image (if any) is deleted before uploading the new one.
 * Sensitive credentials are never touched — only the avatar field is updated.
 */
const updateProfileAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a profile picture');
  }

  const user = await User.findById(req.user._id).select('avatar');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Delete the old Cloudinary image if it exists
  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  // Upload the new image to Cloudinary from the memory buffer
  const uploadResult = await uploadBufferOnCloudinary(req.file.buffer, req.file.mimetype);

  if (!uploadResult) {
    throw new ApiError(500, 'Failed to upload image to Cloudinary');
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: {
        url: uploadResult.url,
        public_id: uploadResult.public_id,
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
    .json(new ApiResponse(200, updatedUser, 'Profile picture updated successfully'));
});

/**
 * @description Delete the authenticated user's profile picture.
 * Deletes the Cloudinary image and resets the avatar to the default placeholder.
 */
const deleteProfileAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('avatar');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Delete the old Cloudinary image if it exists
  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: {
        url: 'https://placehold.co/600x400',
        public_id: '',
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
    .json(new ApiResponse(200, updatedUser, 'Profile picture deleted successfully'));
});

/**
 * @description Update the authenticated user's profile details (fullName, username, email).
 * Prevents duplicate username/email. Does NOT allow changing role, password, tokens,
 * or other sensitive fields.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, username, email } = req.body;

  if (!fullName?.trim() || !username?.trim() || !email?.trim()) {
    throw new ApiError(400, 'Full name, username, and email are required.');
  }

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new ApiError(400, 'Please enter a valid email address.');
  }

  // Check for duplicate username (excluding current user)
  const existingUsername = await User.findOne({
    username: normalizedUsername,
    _id: { $ne: req.user._id },
  });
  if (existingUsername) {
    throw new ApiError(409, 'This username is already taken.');
  }

  // Check for duplicate email (excluding current user)
  const existingEmail = await User.findOne({
    email: normalizedEmail,
    _id: { $ne: req.user._id },
  });
  if (existingEmail) {
    throw new ApiError(409, 'This email is already registered.');
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      fullName: fullName.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
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
    .json(new ApiResponse(200, updatedUser, 'Profile updated successfully'));
});

export { getAllUsers, updateProfileAvatar, deleteProfileAvatar, updateProfile };