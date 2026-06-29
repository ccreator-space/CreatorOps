import { Router } from "express";
import { z } from "zod";
import { mockPosts } from "../services/mock-store";

export const postsRouter = Router();

const createPostSchema = z.object({
  assigneeId: z.string().min(1),
  scheduledDate: z.string().min(1),
  platform: z.enum(["linkedin", "instagram"]),
  title: z.string().min(1),
  content: z.string().min(1)
});

postsRouter.get("/", (_request, response) => {
  response.json({ data: mockPosts });
});

postsRouter.post("/", (request, response) => {
  const payload = createPostSchema.parse(request.body);

  response.status(201).json({
    data: {
      id: crypto.randomUUID(),
      status: "pending_review",
      ...payload
    }
  });
});

