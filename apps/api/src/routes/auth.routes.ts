import { prisma } from "@shipin/db";
import { Router } from "express";
import { z } from "zod";
import { createToken, serializeUser, verifyPassword } from "../services/auth.js";

export const authPublicRouter = Router();
export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

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

authRouter.get("/me", (_request, response) => {
  response.json({
    data: serializeUser(response.locals.currentUser)
  });
});
