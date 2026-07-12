import multer from "multer";
import { AppError } from "../../../utils/AppError.js";

/**
 * Multer configuration for Excel file imports.
 *
 * Uses memory storage so the buffer can be passed directly to ExcelJS
 * without touching the filesystem.
 *
 * Accepted MIME types:
 *   - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet  (.xlsx)
 *   - application/vnd.ms-excel  (.xls)
 *
 * File: src/modules/member2/utils/upload.js
 */

const EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (EXCEL_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Only Excel files (.xlsx / .xls) are accepted for import",
        400
      ),
      false
    );
  }
};

/**
 * Single-file upload middleware.
 * Field name must be "file" in the multipart/form-data request.
 * Maximum file size: 10 MB.
 */
export const uploadExcel = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("file");
