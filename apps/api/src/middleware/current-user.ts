import type { RequestHandler } from "express";
import { findUserById } from "../services/mock-store.js";

export const currentUserMiddleware: RequestHandler = (request, response, next) => {
  const userIdHeader = request.header("x-user-id");
  const userId = userIdHeader?.trim() || "user-1";
  const currentUser = findUserById(userId);

  if (!currentUser) {
    response.status(401).json({ message: "Invalid user context" });
    return;
  }

  response.locals.currentUser = currentUser;
  next();
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
