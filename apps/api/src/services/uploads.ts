import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
export const uploadsDirectory = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(currentDirectory, "../../uploads");

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function saveUpload(file: Express.Multer.File, index: number, folder = "") {
  const targetDirectory = path.join(uploadsDirectory, folder);
  await fs.mkdir(targetDirectory, { recursive: true });

  const extension = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, extension);
  const fileName = `${Date.now()}-${index}-${sanitizeFileName(baseName)}${extension}`;
  const storagePath = path.join(targetDirectory, fileName);

  await fs.writeFile(storagePath, file.buffer);

  return {
    storagePath,
    publicUrl: `/uploads/${folder ? `${folder}/` : ""}${fileName}`
  };
}

export async function deleteUpload(storagePath: string) {
  try {
    await fs.unlink(storagePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
