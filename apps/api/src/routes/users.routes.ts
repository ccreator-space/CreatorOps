import { Router } from "express";
import { mockUsers } from "../services/mock-store.js";

export const usersRouter = Router();

usersRouter.get("/me", (_request, response) => {
  response.json({ data: response.locals.currentUser });
});

usersRouter.get("/", (_request, response) => {
  const currentUser = response.locals.currentUser;

  if (currentUser.role === "admin") {
    response.json({ data: mockUsers });
    return;
  }

  response.json({
    data: mockUsers.filter((user) => user.id === currentUser.id)
  });
});
