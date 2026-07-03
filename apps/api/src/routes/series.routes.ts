import { Prisma, prisma } from "@shipin/db";
import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/current-user.js";
import { serializeUser } from "../services/auth.js";

export const seriesRouter = Router();

seriesRouter.use(requireRole("admin"));

const seriesSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  isActive: z.boolean(),
  userIds: z.array(z.string().min(1))
});

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "series";
}

function serializeSeries(
  series: Prisma.SeriesGetPayload<{
    include: {
      assignments: {
        include: {
          user: true;
        };
      };
    };
  }>
) {
  return {
    id: series.id,
    slug: series.slug,
    title: series.title,
    description: series.description,
    isActive: series.isActive,
    legacyType: series.legacyType,
    createdAt: series.createdAt.toISOString(),
    updatedAt: series.updatedAt.toISOString(),
    assignedUsers: series.assignments.map((assignment) => serializeUser(assignment.user))
  };
}

async function assertUsersExist(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds));
  const users = uniqueUserIds.length
    ? await prisma.user.findMany({
        where: {
          id: {
            in: uniqueUserIds
          }
        }
      })
    : [];

  return users.length === uniqueUserIds.length;
}

async function getSeries(seriesId: string) {
  return prisma.series.findUniqueOrThrow({
    where: {
      id: seriesId
    },
    include: {
      assignments: {
        include: {
          user: true
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });
}

seriesRouter.get("/", async (_request, response, next) => {
  try {
    const series = await prisma.series.findMany({
      include: {
        assignments: {
          include: {
            user: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    response.json({
      data: series.map(serializeSeries)
    });
  } catch (error) {
    next(error);
  }
});

seriesRouter.post("/", async (request, response, next) => {
  try {
    const payload = seriesSchema.parse(request.body);
    const userIds = Array.from(new Set(payload.userIds));

    if (!(await assertUsersExist(userIds))) {
      response.status(400).json({
        message: "One or more users were not found"
      });
      return;
    }

    const slug = payload.slug ?? normalizeSlug(payload.title);

    const series = await prisma.$transaction(async (tx) => {
      const createdSeries = await tx.series.create({
        data: {
          title: payload.title,
          description: payload.description,
          slug,
          isActive: payload.isActive,
          assignments: {
            create: userIds.map((userId) => ({
              userId
            }))
          }
        }
      });

      await tx.submissionForm.create({
        data: {
          title: payload.title,
          description: payload.description,
          slug,
          seriesId: createdSeries.id,
          isActive: payload.isActive
        }
      });

      return tx.series.findUniqueOrThrow({
        where: {
          id: createdSeries.id
        },
        include: {
          assignments: {
            include: {
              user: true
            },
            orderBy: {
              createdAt: "asc"
            }
          }
        }
      });
    });

    response.status(201).json({
      data: serializeSeries(series)
    });
  } catch (error) {
    next(error);
  }
});

seriesRouter.patch("/:seriesId", async (request, response, next) => {
  try {
    const { seriesId } = request.params;
    const payload = seriesSchema.parse(request.body);
    const userIds = Array.from(new Set(payload.userIds));

    if (!(await assertUsersExist(userIds))) {
      response.status(400).json({
        message: "One or more users were not found"
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.series.update({
        where: {
          id: seriesId
        },
        data: {
          title: payload.title,
          description: payload.description,
          slug: payload.slug ?? normalizeSlug(payload.title),
          isActive: payload.isActive
        }
      });

      const defaultForm = await tx.submissionForm.findFirst({
        where: {
          seriesId
        },
        orderBy: {
          createdAt: "asc"
        }
      });

      if (defaultForm) {
        await tx.submissionForm.update({
          where: {
            id: defaultForm.id
          },
          data: {
            title: payload.title,
            description: payload.description,
            slug: payload.slug ?? normalizeSlug(payload.title),
            isActive: payload.isActive
          }
        });
      }

      await tx.submissionSeriesAssignment.deleteMany({
        where: {
          seriesId
        }
      });

      if (userIds.length) {
        await tx.submissionSeriesAssignment.createMany({
          data: userIds.map((userId) => ({
            seriesId,
            userId
          })),
          skipDuplicates: true
        });
      }
    });

    response.json({
      data: serializeSeries(await getSeries(seriesId))
    });
  } catch (error) {
    next(error);
  }
});

seriesRouter.delete("/:seriesId", async (request, response, next) => {
  try {
    const { seriesId } = request.params;

    await prisma.series.delete({
      where: {
        id: seriesId
      }
    });

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});
