import { Prisma, prisma } from "@shipin/db";
import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/current-user.js";
import { hashPassword, serializeUser } from "../services/auth.js";

export const usersRouter = Router();

const userRoleSchema = z.enum(["admin", "user"]);

const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: userRoleSchema,
  avatarUrl: z.string().trim().url().nullable().optional()
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  role: userRoleSchema,
  avatarUrl: z.string().trim().url().nullable().optional(),
  isActive: z.boolean()
});

function createAvatarUrl(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

async function countActiveAdmins(excludingUserId?: string) {
  return prisma.user.count({
    where: {
      role: "admin",
      isActive: true,
      ...(excludingUserId
        ? {
            id: {
              not: excludingUserId
            }
          }
        : {})
    }
  });
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

usersRouter.get("/me", (_request, response) => {
  response.json({ data: response.locals.currentUser });
});

usersRouter.get("/", async (_request, response, next) => {
  try {
    const currentUser = response.locals.currentUser;

    if (currentUser.role === "admin") {
      const users = await prisma.user.findMany({
        orderBy: {
          name: "asc"
        }
      });

      response.json({ data: users.map(serializeUser) });
      return;
    }

    response.json({
      data: [currentUser]
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/", requireRole("admin"), async (request, response, next) => {
  try {
    const payload = createUserSchema.parse(request.body);
    const name = payload.name.trim();

    const user = await prisma.user.create({
      data: {
        name,
        email: payload.email.toLowerCase(),
        passwordHash: hashPassword(payload.password),
        role: payload.role,
        avatarUrl: payload.avatarUrl || createAvatarUrl(name)
      }
    });

    response.status(201).json({
      data: serializeUser(user)
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

usersRouter.patch("/:userId", requireRole("admin"), async (request, response, next) => {
  try {
    const { userId } = request.params;
    const payload = updateUserSchema.parse(request.body);
    const currentUser = response.locals.currentUser;
    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!existingUser) {
      response.status(404).json({
        message: "User not found"
      });
      return;
    }

    const wouldRemoveActiveAdmin =
      existingUser.role === "admin" && (!payload.isActive || payload.role !== "admin");

    if (wouldRemoveActiveAdmin && (await countActiveAdmins(userId)) === 0) {
      response.status(400).json({
        message: "At least one active admin is required"
      });
      return;
    }

    if (currentUser.id === userId && !payload.isActive) {
      response.status(400).json({
        message: "You cannot deactivate your own account"
      });
      return;
    }

    const name = payload.name.trim();
    const user = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        name,
        email: payload.email.toLowerCase(),
        role: payload.role,
        isActive: payload.isActive,
        avatarUrl: payload.avatarUrl || createAvatarUrl(name)
      }
    });

    response.json({
      data: serializeUser(user)
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
