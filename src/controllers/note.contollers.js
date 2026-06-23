import mongoose from 'mongoose';
import { ProjectNote } from '../models/note.models.js';
import { Project } from '../models/project.models.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

const getNotes = asyncHandler(async (req, res) => {
  // Get project id from URL params
  const { projectId } = req.params;

  // Check if project exists
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Fetch all notes belonging to this project
  // Populate creator details instead of only ObjectId
  const notes = await ProjectNote.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate('createdBy', 'username fullName avatar');

  // Send notes to client
  return res
    .status(200)
    .json(new ApiResponse(200, notes, 'Notes fetched successfully'));
});

const createNote = asyncHandler(async (req, res) => {
  // Get project id from params and note content from body
  const { projectId } = req.params;
  const { content } = req.body;

  // Check if project exists
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Create a new note
  const note = await ProjectNote.create({
    // Associate note with project
    project: new mongoose.Types.ObjectId(projectId),

    // Note text/content
    content,

    // Logged in user creating the note
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });

  // Populate creator details before sending response
  const populatedNote = await ProjectNote.findById(note._id).populate(
    'createdBy',
    'username fullName avatar'
  );

  // Send created note
  return res
    .status(201)
    .json(new ApiResponse(201, populatedNote, 'Note created successfully'));
});

const updateNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { content } = req.body;

  // Find the note first to check if it exists
  const existingNote = await ProjectNote.findById(noteId);
  if (!existingNote) {
    throw new ApiError(404, 'Note not found');
  }

  // Update the note and populate the createdBy field
  const note = await ProjectNote.findByIdAndUpdate(
    noteId,
    { content },
    { new: true }
  ).populate('createdBy', 'username fullName avatar');

  return res
    .status(200)
    .json(new ApiResponse(200, note, 'Note updated successfully'));
});

const deleteNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await ProjectNote.findByIdAndDelete(noteId);

  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, 'Note deleted successfully'));
});

const getNoteById = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await ProjectNote.findById(noteId).populate(
    'createdBy',
    'username fullName avatar'
  );

  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, 'Note fetched successfully'));
});

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
