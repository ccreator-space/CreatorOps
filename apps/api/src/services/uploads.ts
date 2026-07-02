import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
export const uploadsDirectory = path.resolve(currentDirectory, "../../uploads");

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function saveUpload(file: Express.Multer.File, index: number) {
  await fs.mkdir(uploadsDirectory, { recursive: true });

  const extension = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, extension);
  const fileName = `${Date.now()}-${index}-${sanitizeFileName(baseName)}${extension}`;
  const storagePath = path.join(uploadsDirectory, fileName);

  await fs.writeFile(storagePath, file.buffer);

  return {
    storagePath,
    publicUrl: `/uploads/${fileName}`
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
