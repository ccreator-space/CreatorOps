import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { mockPosts } from "../services/mock-store.js";

export const postsRouter = Router();

const createPostSchema = z.object({
  assigneeId: z.string().min(1),
  scheduledDate: z.string().min(1),
  platform: z.enum(["linkedin", "instagram"]),
  title: z.string().min(1),
  content: z.string().min(1)
});

postsRouter.get("/", (request, response) => {
  const currentUser = response.locals.currentUser;
  const status = typeof request.query.status === "string" ? request.query.status : undefined;

  const scopedPosts =
    currentUser.role === "admin"
      ? mockPosts
      : mockPosts.filter((post) => post.assigneeId === currentUser.id);

  response.json({
    data: status ? scopedPosts.filter((post) => post.status === status) : scopedPosts
  });
});

postsRouter.post("/", (request, response) => {
  const payload = createPostSchema.parse(request.body);
  const currentUser = response.locals.currentUser;

  if (currentUser.role !== "admin" && payload.assigneeId !== currentUser.id) {
    response.status(403).json({
      message: "Users can only create calendar content for themselves"
    });
    return;
  }

  response.status(201).json({
    data: {
      id: randomUUID(),
      status: "pending_review",
      ...payload
    }
  });
});
