import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { UserRolesEnum } from "../utils/constants.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({
      role: UserRolesEnum.ADMIN,
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      return;
    }

    await User.create({
      fullName: process.env.ADMIN_FULL_NAME,
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: UserRolesEnum.ADMIN,
      isEmailVerified: true,
    });

    console.log("Admin created successfully.");
  } catch (error) {
    console.error("Failed to create admin:", error);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();