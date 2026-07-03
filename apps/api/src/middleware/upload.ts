import multer from "multer";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf"
]);

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml"
]);

export const postUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Unsupported file type"));
      return;
    }

    callback(null, true);
  }
});

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      callback(new Error("Unsupported image type"));
      return;
    }

    callback(null, true);
  }
});
