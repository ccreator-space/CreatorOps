import { Prisma, prisma } from "@shipin/db";
import { Router } from "express";
import { z } from "zod";
import { createToken, hashPassword, serializeUser, verifyPassword } from "../services/auth.js";

export const authPublicRouter = Router();
export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const bootstrapAdminSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8)
});

function createAvatarUrl(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function hasActiveAdmin() {
  const activeAdminCount = await prisma.user.count({
    where: {
      role: "admin",
      isActive: true
    }
  });

  return activeAdminCount > 0;
}

authPublicRouter.post("/login", async (request, response, next) => {
  try {
    const payload = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({
      where: {
        email: payload.email
      }
    });

    if (!user || !user.isActive || !verifyPassword(payload.password, user.passwordHash)) {
      response.status(401).json({
        message: "Invalid email or password"
      });
      return;
    }

    response.json({
      data: {
        token: createToken(user.id),
        user: serializeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
});

authPublicRouter.get("/bootstrap-status", async (_request, response, next) => {
  try {
    response.json({
      data: {
        needsBootstrap: !(await hasActiveAdmin())
      }
    });
  } catch (error) {
    next(error);
  }
});

authPublicRouter.post("/bootstrap-admin", async (request, response, next) => {
  try {
    const payload = bootstrapAdminSchema.parse(request.body);
    const name = payload.name.trim();

    const user = await prisma.$transaction(async (transaction) => {
      const activeAdminCount = await transaction.user.count({
        where: {
          role: "admin",
          isActive: true
        }
      });

      if (activeAdminCount > 0) {
        return null;
      }

      return transaction.user.create({
        data: {
          name,
          email: payload.email.toLowerCase(),
          passwordHash: hashPassword(payload.password),
          role: "admin",
          isActive: true,
          avatarUrl: createAvatarUrl(name)
        }
      });
    });

    if (!user) {
      response.status(409).json({
        message: "Bootstrap is already completed"
      });
      return;
    }

    response.status(201).json({
      data: {
        token: createToken(user.id),
        user: serializeUser(user)
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      response.status(409).json({
        message: "Email is already in use"
      });
      return;
    }

    next(error);
  }
});

authRouter.get("/me", (_request, response) => {
  response.json({
    data: serializeUser(response.locals.currentUser)
  });
});
