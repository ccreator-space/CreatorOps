export type PreparedMedia = {
  id: string;
  file: File;
  previewUrl?: string;
  type: "image" | "pdf";
  originalName: string;
  originalSize: number;
  compressedSize: number;
  width?: number;
  height?: number;
};

const maxImageSize = 1600;
const jpegQuality = 0.78;
const compressibleImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image could not be loaded"));
    };
    image.src = objectUrl;
  });
}

function getTargetSize(width: number, height: number) {
  const ratio = Math.min(1, maxImageSize / Math.max(width, height));

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image could not be compressed"));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      jpegQuality
    );
  });
}

export async function prepareMediaFile(file: File): Promise<PreparedMedia> {
  if (file.type === "application/pdf") {
    return {
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      type: "pdf",
      originalName: file.name,
      originalSize: file.size,
      compressedSize: file.size
    };
  }

  if (!compressibleImageTypes.has(file.type)) {
    return {
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      type: "image",
      originalName: file.name,
      originalSize: file.size,
      compressedSize: file.size
    };
  }

  const image = await loadImage(file);
  const targetSize = getTargetSize(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = targetSize.width;
  canvas.height = targetSize.height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available");
  }

  context.drawImage(image, 0, 0, targetSize.width, targetSize.height);

  const blob = await canvasToBlob(canvas);
  const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg"
  });

  return {
    id: crypto.randomUUID(),
    file: compressedFile,
    previewUrl: URL.createObjectURL(compressedFile),
    type: "image",
    originalName: file.name,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    width: targetSize.width,
    height: targetSize.height
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
