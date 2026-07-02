import { prisma, type ReviewEvent, type SocialPost, type User } from "@shipin/db";
import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/current-user.js";
import { serializeUser } from "../services/auth.js";

export const postsRouter = Router();

const createPostSchema = z.object({
  assigneeId: z.string().min(1),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  platform: z.enum(["linkedin", "instagram"]),
  title: z.string().min(1),
  content: z.string().min(1)
});

const postStatusSchema = z.enum([
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "revision_requested"
]);

const reviewActionSchema = z.object({
  action: z.enum(["approve", "reject", "request_revision"]),
  note: z.string().trim().optional()
});

const resubmitPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1)
});

type PostWithAuthor = SocialPost & {
  author: User;
  reviews?: ReviewEvent[];
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
    author: serializeUser(post.author),
    latestReview: post.reviews?.[0]
  };
}

postsRouter.get("/", async (request, response, next) => {
  try {
    const currentUser = response.locals.currentUser;
    const status =
      typeof request.query.status === "string"
        ? postStatusSchema.parse(request.query.status)
        : undefined;

    const posts = await prisma.socialPost.findMany({
      where: {
        ...(currentUser.role === "admin" ? {} : { authorId: currentUser.id }),
        ...(status ? { status } : {})
      },
      include: {
        author: true,
        reviews: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
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

postsRouter.post("/:postId/review", requireRole("admin"), async (request, response, next) => {
  try {
    const { postId } = request.params;
    const payload = reviewActionSchema.parse(request.body);
    const currentUser = response.locals.currentUser;

    const nextStatus =
      payload.action === "approve"
        ? "approved"
        : payload.action === "reject"
          ? "rejected"
          : "revision_requested";

    if (payload.action === "request_revision" && !payload.note) {
      response.status(400).json({
        message: "Revision note is required"
      });
      return;
    }

    const existingPost = await prisma.socialPost.findUnique({
      where: {
        id: postId
      }
    });

    if (!existingPost) {
      response.status(404).json({
        message: "Post not found"
      });
      return;
    }

    const post = await prisma.$transaction(async (tx) => {
      const updatedPost = await tx.socialPost.update({
        where: {
          id: postId
        },
        data: {
          status: nextStatus
        },
        include: {
          author: true
        }
      });

      const review = await tx.reviewEvent.create({
        data: {
          postId,
          actorId: currentUser.id,
          status: nextStatus,
          note: payload.note
        }
      });

      return {
        ...updatedPost,
        reviews: [review]
      };
    });

    response.json({
      data: serializePost(post)
    });
  } catch (error) {
    next(error);
  }
});

postsRouter.post("/:postId/resubmit", async (request, response, next) => {
  try {
    const { postId } = request.params;
    const payload = resubmitPostSchema.parse(request.body);
    const currentUser = response.locals.currentUser;

    const existingPost = await prisma.socialPost.findUnique({
      where: {
        id: postId
      }
    });

    if (!existingPost) {
      response.status(404).json({
        message: "Post not found"
      });
      return;
    }

    if (existingPost.authorId !== currentUser.id) {
      response.status(403).json({
        message: "Users can only resubmit their own posts"
      });
      return;
    }

    if (existingPost.status !== "revision_requested") {
      response.status(400).json({
        message: "Only revision requested posts can be resubmitted"
      });
      return;
    }

    const post = await prisma.$transaction(async (tx) => {
      const updatedPost = await tx.socialPost.update({
        where: {
          id: postId
        },
        data: {
          title: payload.title.trim(),
          content: payload.content.trim(),
          status: "pending_review"
        },
        include: {
          author: true
        }
      });

      const review = await tx.reviewEvent.create({
        data: {
          postId,
          actorId: currentUser.id,
          status: "pending_review",
          note: "Tekrar onaya gönderildi"
        }
      });

      return {
        ...updatedPost,
        reviews: [review]
      };
    });

    response.json({
      data: serializePost(post)
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
