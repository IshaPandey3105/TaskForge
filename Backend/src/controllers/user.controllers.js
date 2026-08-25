import { User } from '../models/user.models.js';
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

export { getAllUsers };