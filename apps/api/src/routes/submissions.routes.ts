import { prisma } from "@shipin/db";
import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/current-user.js";
import { serializeSeriesAssignment, serializeSubmission } from "../services/submissions.js";

export const submissionsRouter = Router();
export const submissionAssignmentsRouter = Router();

const submissionTypeSchema = z.enum(["builder_spotlight", "project_highlight", "readme_book"]);
const submissionStatusSchema = z.enum([
  "new",
  "assigned",
  "in_progress",
  "approved",
  "rejected",
  "archived"
]);

const updateStatusSchema = z.object({
  status: submissionStatusSchema
});

const assignSubmissionSchema = z.object({
  assignedToId: z.string().min(1).nullable()
});

const seriesAssignmentsSchema = z.object({
  assignments: z.array(
    z.object({
      seriesType: submissionTypeSchema,
      userIds: z.array(z.string().min(1))
    })
  )
});

async function getVisibleSeriesTypes(userId: string) {
  const assignments = await prisma.submissionSeriesAssignment.findMany({
    where: {
      userId
    }
  });

  return assignments.map((assignment) => assignment.seriesType);
}

submissionsRouter.get("/", async (_request, response, next) => {
  try {
    const currentUser = response.locals.currentUser;
    const visibleSeriesTypes =
      currentUser.role === "admin" ? [] : await getVisibleSeriesTypes(currentUser.id);

    const submissions = await prisma.submission.findMany({
      where:
        currentUser.role === "admin"
          ? {}
          : {
              OR: [
                {
                  assignedToId: currentUser.id
                },
                {
                  type: {
                    in: visibleSeriesTypes
                  }
                }
              ]
            },
      include: {
        form: {
          include: {
            questions: {
              orderBy: {
                sortOrder: "asc"
              }
            }
          }
        },
        assignedTo: true,
        attachments: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    response.json({
      data: submissions.map(serializeSubmission)
    });
  } catch (error) {
    next(error);
  }
});

submissionsRouter.patch("/:submissionId/status", async (request, response, next) => {
  try {
    const { submissionId } = request.params;
    const payload = updateStatusSchema.parse(request.body);
    const currentUser = response.locals.currentUser;
    const visibleSeriesTypes =
      currentUser.role === "admin" ? [] : await getVisibleSeriesTypes(currentUser.id);

    const existingSubmission = await prisma.submission.findUnique({
      where: {
        id: submissionId
      }
    });

    if (!existingSubmission) {
      response.status(404).json({
        message: "Submission not found"
      });
      return;
    }

    const canUpdate =
      currentUser.role === "admin" ||
      existingSubmission.assignedToId === currentUser.id ||
      visibleSeriesTypes.includes(existingSubmission.type);

    if (!canUpdate) {
      response.status(403).json({
        message: "Forbidden"
      });
      return;
    }

    const submission = await prisma.submission.update({
      where: {
        id: submissionId
      },
      data: {
        status: payload.status
      },
      include: {
        form: {
          include: {
            questions: {
              orderBy: {
                sortOrder: "asc"
              }
            }
          }
        },
        assignedTo: true,
        attachments: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    response.json({
      data: serializeSubmission(submission)
    });
  } catch (error) {
    next(error);
  }
});

submissionsRouter.patch("/:submissionId/assign", requireRole("admin"), async (request, response, next) => {
  try {
    const { submissionId } = request.params;
    const payload = assignSubmissionSchema.parse(request.body);

    if (payload.assignedToId) {
      const user = await prisma.user.findUnique({
        where: {
          id: payload.assignedToId
        }
      });

      if (!user) {
        response.status(404).json({
          message: "User not found"
        });
        return;
      }
    }

    const submission = await prisma.submission.update({
      where: {
        id: submissionId
      },
      data: {
        assignedToId: payload.assignedToId,
        status: payload.assignedToId ? "assigned" : "new"
      },
      include: {
        form: {
          include: {
            questions: {
              orderBy: {
                sortOrder: "asc"
              }
            }
          }
        },
        assignedTo: true,
        attachments: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    response.json({
      data: serializeSubmission(submission)
    });
  } catch (error) {
    next(error);
  }
});

submissionAssignmentsRouter.get("/", requireRole("admin"), async (_request, response, next) => {
  try {
    const assignments = await prisma.submissionSeriesAssignment.findMany({
      include: {
        user: true
      },
      orderBy: [
        {
          seriesType: "asc"
        },
        {
          createdAt: "asc"
        }
      ]
    });

    response.json({
      data: assignments.map(serializeSeriesAssignment)
    });
  } catch (error) {
    next(error);
  }
});

submissionAssignmentsRouter.put("/", requireRole("admin"), async (request, response, next) => {
  try {
    const payload = seriesAssignmentsSchema.parse(request.body);

    const userIds = new Set(payload.assignments.flatMap((assignment) => assignment.userIds));
    const users = userIds.size
      ? await prisma.user.findMany({
          where: {
            id: {
              in: Array.from(userIds)
            }
          }
        })
      : [];

    if (users.length !== userIds.size) {
      response.status(400).json({
        message: "One or more users were not found"
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.submissionSeriesAssignment.deleteMany();

      const rows = payload.assignments.flatMap((assignment) =>
        assignment.userIds.map((userId) => ({
          seriesType: assignment.seriesType,
          userId
        }))
      );

      if (rows.length) {
        await tx.submissionSeriesAssignment.createMany({
          data: rows,
          skipDuplicates: true
        });
      }
    });

    const assignments = await prisma.submissionSeriesAssignment.findMany({
      include: {
        user: true
      },
      orderBy: [
        {
          seriesType: "asc"
        },
        {
          createdAt: "asc"
        }
      ]
    });

    response.json({
      data: assignments.map(serializeSeriesAssignment)
    });
  } catch (error) {
    next(error);
  }
});
