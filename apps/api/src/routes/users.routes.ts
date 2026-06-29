import { Router } from "express";
import { mockUsers } from "../services/mock-store";

export const usersRouter = Router();

usersRouter.get("/", (_request, response) => {
  response.json({ data: mockUsers });
});

