import multer from "multer";
import path from "node:path";
import {
  MAX_FILE_SIZE,
  MAX_FILES,
  ALLOWED_EXTENSIONS
} from "../config/uploadConfig.js";

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext) || !allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error(
      "Format file tidak didukung. Gunakan PDF, DOC, DOCX, XLS, atau XLSX."
    ));
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
    fields: 100,
    parts: MAX_FILES + 120
  }
});

export default upload;
