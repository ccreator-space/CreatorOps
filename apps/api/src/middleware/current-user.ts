import { prisma } from "@shipin/db";
import type { RequestHandler } from "express";
import { serializeUser, verifyToken } from "../services/auth.js";

export const currentUserMiddleware: RequestHandler = async (request, response, next) => {
  const authorizationHeader = request.header("authorization");
  const token = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : "";
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: {
        id: payload.sub
      }
    });

    if (!currentUser) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    response.locals.currentUser = serializeUser(currentUser);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole =
  (...roles: Array<"admin" | "user">): RequestHandler =>
  (_request, response, next) => {
    const currentUser = response.locals.currentUser;

    if (!currentUser || !roles.includes(currentUser.role)) {
      response.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
