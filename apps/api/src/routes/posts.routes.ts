import { prisma, type SocialPost, type User } from "@shipin/db";
import { Router } from "express";
import { z } from "zod";

export const postsRouter = Router();

const createPostSchema = z.object({
  assigneeId: z.string().min(1),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  platform: z.enum(["linkedin", "instagram"]),
  title: z.string().min(1),
  content: z.string().min(1)
});

type PostWithAuthor = SocialPost & {
  author: User;
};

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function serializePost(post: PostWithAuthor) {
  return {
    id: post.id,
    assigneeId: post.authorId,
    scheduledDate: toDateOnly(post.scheduledFor),
    platform: post.platform,
    title: post.title,
    content: post.content,
    status: post.status,
    author: post.author
  };
}

postsRouter.get("/", async (request, response, next) => {
  try {
    const currentUser = response.locals.currentUser;
    const status = typeof request.query.status === "string" ? request.query.status : undefined;

    const posts = await prisma.socialPost.findMany({
      where: {
        ...(currentUser.role === "admin" ? {} : { authorId: currentUser.id }),
        ...(status ? { status: status as SocialPost["status"] } : {})
      },
      include: {
        author: true
      },
      orderBy: {
        scheduledFor: "asc"
      }
    });

    response.json({
      data: posts.map(serializePost)
    });
  } catch (error) {
    next(error);
  }
});

postsRouter.post("/", async (request, response, next) => {
  try {
    const payload = createPostSchema.parse(request.body);
    const currentUser = response.locals.currentUser;

    if (currentUser.role !== "admin" && payload.assigneeId !== currentUser.id) {
      response.status(403).json({
        message: "Users can only create calendar content for themselves"
      });
      return;
    }

    const author = await prisma.user.findUnique({
      where: {
        id: payload.assigneeId
      }
    });

    if (!author) {
      response.status(404).json({
        message: "User not found"
      });
      return;
    }

    const scheduledFor = parseDateOnly(payload.scheduledDate);
    const assignment = await prisma.calendarAssignment.findFirst({
      where: {
        date: scheduledFor,
        userId: payload.assigneeId
      }
    });

    const post = await prisma.socialPost.create({
      data: {
        platform: payload.platform,
        title: payload.title,
        content: payload.content,
        status: "pending_review",
        scheduledFor,
        authorId: payload.assigneeId,
        assignmentId: assignment?.id
      },
      include: {
        author: true
      }
    });

    response.status(201).json({
      data: serializePost(post)
    });
  } catch (error) {
    next(error);
  }
});
