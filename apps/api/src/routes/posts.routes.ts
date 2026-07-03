import {
  prisma,
  type PostAttachment,
  type ReviewEvent,
  type SocialPost,
  type User
} from "@shipin/db";
import { Router, type Request } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/current-user.js";
import { postUpload } from "../middleware/upload.js";
import { serializeUser } from "../services/auth.js";
import { deleteUpload, saveUpload } from "../services/uploads.js";

export const postsRouter = Router();

const createPostSchema = z.object({
  assigneeId: z.string().min(1),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  platform: z.enum(["linkedin", "instagram"]),
  title: z.string().min(1),
  content: z.string().min(1)
});

const updatePostSchema = createPostSchema.extend({
  keepAttachmentIds: z.union([z.string(), z.array(z.string())]).optional()
});

const postStatusSchema = z.enum([
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "revision_requested"
]);

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

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
  attachments?: PostAttachment[];
};

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getMonthRange(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));

  return { start, end };
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
    latestReview: post.reviews?.[0],
    attachments:
      post.attachments?.map((attachment) => ({
        id: attachment.id,
        type: attachment.type,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        compressedSizeBytes: attachment.compressedSizeBytes,
        width: attachment.width,
        height: attachment.height,
        publicUrl: attachment.publicUrl,
        sortOrder: attachment.sortOrder
      })) ?? []
  };
}

function getUploadedFiles(request: Request) {
  return Array.isArray(request.files) ? request.files : [];
}

function parseOptionalNumber(value: unknown) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getArrayValue(value: unknown, index: number) {
  if (Array.isArray(value)) {
    return value[index];
  }

  return index === 0 ? value : undefined;
}

function getStringArrayValue(value: unknown) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function assertUserCanMutatePost(
  currentUser: { id: string; role: "admin" | "user" },
  post: SocialPost
) {
  if (currentUser.role === "admin") {
    return true;
  }

  return post.authorId === currentUser.id && post.status !== "approved";
}

function validateAttachmentCount(platform: "linkedin" | "instagram", count: number) {
  const maxAttachments = platform === "instagram" ? 10 : 5;

  return count <= maxAttachments;
}

postsRouter.get("/", async (request, response, next) => {
  try {
    const currentUser = response.locals.currentUser;
    const status =
      typeof request.query.status === "string"
        ? postStatusSchema.parse(request.query.status)
        : undefined;
    const month =
      typeof request.query.month === "string" ? monthSchema.parse(request.query.month) : undefined;
    const monthRange = month ? getMonthRange(month) : undefined;

    const posts = await prisma.socialPost.findMany({
      where: {
        ...(currentUser.role === "admin" ? {} : { authorId: currentUser.id }),
        ...(status ? { status } : {}),
        ...(monthRange
          ? {
              scheduledFor: {
                gte: monthRange.start,
                lt: monthRange.end
              }
            }
          : {})
      },
      include: {
        author: true,
        attachments: {
          orderBy: {
            sortOrder: "asc"
          }
        },
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
          author: true,
          attachments: {
            orderBy: {
              sortOrder: "asc"
            }
          }
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
          author: true,
          attachments: {
            orderBy: {
              sortOrder: "asc"
            }
          }
        }
      });

      const review = await tx.reviewEvent.create({
        data: {
          postId,
          actorId: currentUser.id,
          status: "pending_review",
          note: "Sent back for review"
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

postsRouter.patch("/:postId", postUpload.array("attachments", 10), async (request, response, next) => {
  try {
    const { postId } = request.params;
    const payload = updatePostSchema.parse(request.body);
    const currentUser = response.locals.currentUser;
    const files = getUploadedFiles(request);

    const existingPost = await prisma.socialPost.findUnique({
      where: {
        id: postId
      },
      include: {
        attachments: true
      }
    });

    if (!existingPost) {
      response.status(404).json({
        message: "Post not found"
      });
      return;
    }

    if (!assertUserCanMutatePost(currentUser, existingPost)) {
      response.status(403).json({
        message: "Users can only update their own non-approved posts"
      });
      return;
    }

    if (currentUser.role !== "admin" && payload.assigneeId !== currentUser.id) {
      response.status(403).json({
        message: "Users can only assign posts to themselves"
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

    const keepAttachmentIds = getStringArrayValue(payload.keepAttachmentIds);
    const keptAttachments = existingPost.attachments.filter((attachment) =>
      keepAttachmentIds.includes(attachment.id)
    );
    const removedAttachments = existingPost.attachments.filter(
      (attachment) => !keepAttachmentIds.includes(attachment.id)
    );
    const nextAttachmentCount = keptAttachments.length + files.length;

    if (!validateAttachmentCount(payload.platform, nextAttachmentCount)) {
      response.status(400).json({
        message: `${payload.platform} posts include too many attachments`
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
    const savedUploads = await Promise.all(files.map((file, index) => saveUpload(file, index)));
    const shouldReturnToReview =
      currentUser.role !== "admin" && existingPost.status === "revision_requested";
    const nextStatus = shouldReturnToReview ? "pending_review" : existingPost.status;

    const post = await prisma.$transaction(async (tx) => {
      await tx.postAttachment.deleteMany({
        where: {
          id: {
            in: removedAttachments.map((attachment) => attachment.id)
          }
        }
      });

      await Promise.all(
        keptAttachments.map((attachment, index) =>
          tx.postAttachment.update({
            where: {
              id: attachment.id
            },
            data: {
              sortOrder: index
            }
          })
        )
      );

      const updatedPost = await tx.socialPost.update({
        where: {
          id: postId
        },
        data: {
          platform: payload.platform,
          title: payload.title.trim(),
          content: payload.content.trim(),
          status: nextStatus,
          scheduledFor,
          authorId: payload.assigneeId,
          assignmentId: assignment?.id ?? null
        },
        include: {
          author: true,
          attachments: {
            orderBy: {
              sortOrder: "asc"
            }
          }
        }
      });

      if (files.length) {
        await tx.postAttachment.createMany({
          data: files.map((file, index) => {
            const originalSize = parseOptionalNumber(getArrayValue(request.body.originalSizeBytes, index));
            const width = parseOptionalNumber(getArrayValue(request.body.width, index));
            const height = parseOptionalNumber(getArrayValue(request.body.height, index));

            return {
              postId,
              type: file.mimetype === "application/pdf" ? "pdf" : "image",
              originalName: file.originalname,
              mimeType: file.mimetype,
              sizeBytes: originalSize ?? file.size,
              compressedSizeBytes: file.size,
              width,
              height,
              storagePath: savedUploads[index].storagePath,
              publicUrl: savedUploads[index].publicUrl,
              sortOrder: keptAttachments.length + index
            };
          })
        });
      }

      const postWithAttachments = await tx.socialPost.findUniqueOrThrow({
        where: {
          id: postId
        },
        include: {
          author: true,
          attachments: {
            orderBy: {
              sortOrder: "asc"
            }
          }
        }
      });

      if (shouldReturnToReview) {
        const review = await tx.reviewEvent.create({
          data: {
            postId,
            actorId: currentUser.id,
            status: "pending_review",
            note: "Content was updated and sent back for review"
          }
        });

        return {
          ...postWithAttachments,
          reviews: [review]
        };
      }

      return updatedPost;
    });

    await Promise.all(removedAttachments.map((attachment) => deleteUpload(attachment.storagePath)));

    response.json({
      data: serializePost(post)
    });
  } catch (error) {
    next(error);
  }
});

postsRouter.delete("/:postId", async (request, response, next) => {
  try {
    const { postId } = request.params;
    const currentUser = response.locals.currentUser;

    const existingPost = await prisma.socialPost.findUnique({
      where: {
        id: postId
      },
      include: {
        attachments: true
      }
    });

    if (!existingPost) {
      response.status(404).json({
        message: "Post not found"
      });
      return;
    }

    if (!assertUserCanMutatePost(currentUser, existingPost)) {
      response.status(403).json({
        message: "Users can only delete their own non-approved posts"
      });
      return;
    }

    await prisma.socialPost.delete({
      where: {
        id: postId
      }
    });

    await Promise.all(existingPost.attachments.map((attachment) => deleteUpload(attachment.storagePath)));

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

postsRouter.post("/", postUpload.array("attachments", 10), async (request, response, next) => {
  try {
    const payload = createPostSchema.parse(request.body);
    const currentUser = response.locals.currentUser;
    const files = getUploadedFiles(request);

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

    if (!validateAttachmentCount(payload.platform, files.length)) {
      response.status(400).json({
        message: `${payload.platform} posts include too many attachments`
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

    const savedUploads = await Promise.all(files.map((file, index) => saveUpload(file, index)));

    const post = await prisma.socialPost.create({
      data: {
        platform: payload.platform,
        title: payload.title,
        content: payload.content,
        status: "pending_review",
        scheduledFor,
        authorId: payload.assigneeId,
        assignmentId: assignment?.id,
        attachments: {
          create: files.map((file, index) => {
            const originalSize = parseOptionalNumber(getArrayValue(request.body.originalSizeBytes, index));
            const width = parseOptionalNumber(getArrayValue(request.body.width, index));
            const height = parseOptionalNumber(getArrayValue(request.body.height, index));

            return {
              type: file.mimetype === "application/pdf" ? "pdf" : "image",
              originalName: file.originalname,
              mimeType: file.mimetype,
              sizeBytes: originalSize ?? file.size,
              compressedSizeBytes: file.size,
              width,
              height,
              storagePath: savedUploads[index].storagePath,
              publicUrl: savedUploads[index].publicUrl,
              sortOrder: index
            };
          })
        }
      },
      include: {
        author: true,
        attachments: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    response.status(201).json({
      data: serializePost(post)
    });
  } catch (error) {
    next(error);
  }
});
