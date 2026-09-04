import multer from "multer";

// Use memory storage so uploaded files are temporary and never saved
// permanently to disk. Files are uploaded to Cloudinary and the temp
// buffer is discarded after the request.
const storage = multer.memoryStorage();

// Middleware responsible to read form data and upload the File object to memory
export const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
});
