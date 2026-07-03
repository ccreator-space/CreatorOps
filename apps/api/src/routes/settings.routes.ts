import { prisma } from "@shipin/db";
import { Router } from "express";
import { requireRole } from "../middleware/current-user.js";
import { imageUpload } from "../middleware/upload.js";
import { deleteUpload, saveUpload } from "../services/uploads.js";

export const publicSettingsRouter = Router();
export const settingsRouter = Router();

const settingsId = "app-settings";

function serializeSettings(settings: {
  logoUrl: string | null;
}) {
  return {
    logoUrl: settings.logoUrl
  };
}

async function getSettings() {
  return prisma.appSettings.upsert({
    where: {
      id: settingsId
    },
    update: {},
    create: {
      id: settingsId
    }
  });
}

publicSettingsRouter.get("/", async (_request, response, next) => {
  try {
    const settings = await getSettings();

    response.json({
      data: serializeSettings(settings)
    });
  } catch (error) {
    next(error);
  }
});

settingsRouter.patch("/logo", requireRole("admin"), imageUpload.single("logo"), async (request, response, next) => {
  try {
    const file = request.file;

    if (!file) {
      response.status(400).json({
        message: "Logo file is required"
      });
      return;
    }

    const currentSettings = await getSettings();
    const upload = await saveUpload(file, 0, "settings");
    const settings = await prisma.appSettings.update({
      where: {
        id: settingsId
      },
      data: {
        logoUrl: upload.publicUrl,
        logoStoragePath: upload.storagePath
      }
    });

    if (currentSettings.logoStoragePath) {
      await deleteUpload(currentSettings.logoStoragePath);
    }

    response.json({
      data: serializeSettings(settings)
    });
  } catch (error) {
    next(error);
  }
});
