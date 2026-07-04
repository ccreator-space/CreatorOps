import { prisma } from "@shipin/db";
import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/current-user.js";
import { imageUpload } from "../middleware/upload.js";
import { deleteUpload, saveUpload } from "../services/uploads.js";

export const publicSettingsRouter = Router();
export const settingsRouter = Router();

const settingsId = "app-settings";
const defaultPrimaryColor = "#1f6f5b";

const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/)
});

function serializeSettings(settings: {
  logoUrl: string | null;
  primaryColor: string;
}) {
  return {
    logoUrl: settings.logoUrl,
    primaryColor: settings.primaryColor || defaultPrimaryColor
  };
}

async function getSettings() {
  return prisma.appSettings.upsert({
    where: {
      id: settingsId
    },
    update: {},
    create: {
      id: settingsId,
      primaryColor: defaultPrimaryColor
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

settingsRouter.patch("/theme", requireRole("admin"), async (request, response, next) => {
  try {
    const payload = themeSchema.parse(request.body);
    const settings = await prisma.appSettings.upsert({
      where: {
        id: settingsId
      },
      create: {
        id: settingsId,
        primaryColor: payload.primaryColor.toLowerCase()
      },
      update: {
        primaryColor: payload.primaryColor.toLowerCase()
      }
    });

    response.json({
      data: serializeSettings(settings)
    });
  } catch (error) {
    next(error);
  }
});
