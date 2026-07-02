import { prisma } from "@shipin/db";
import { Router } from "express";
import { serializeUser } from "../services/auth.js";

export const usersRouter = Router();

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
