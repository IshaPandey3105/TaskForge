import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

//  Compound unique index
//  Same user cannot have two projects with the same name.
//  Different users can have projects with the same name.

projectSchema.index(
  { createdBy: 1, name: 1 },
  { unique: true }
);

export const Project = mongoose.model("Project", projectSchema);