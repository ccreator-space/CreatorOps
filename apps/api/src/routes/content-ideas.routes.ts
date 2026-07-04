import { prisma, type ContentIdea, type User } from "@shipin/db";
import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/current-user.js";
import { serializeUser } from "../services/auth.js";

export const contentIdeasRouter = Router();

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

const upsertContentIdeaSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1),
  description: z.string().trim().optional()
});

type ContentIdeaWithCreator = ContentIdea & {
  createdBy: User;
};

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getMonthRange(month?: string) {
  const selectedMonth = month ?? new Date().toISOString().slice(0, 7);
  const [year, monthIndex] = selectedMonth.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));

  return { start, end };
}

function serializeContentIdea(idea: ContentIdeaWithCreator) {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    date: toDateOnly(idea.date),
    createdBy: serializeUser(idea.createdBy),
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString()
  };
}

contentIdeasRouter.get("/", async (request, response, next) => {
  try {
    const month =
      typeof request.query.month === "string" ? monthSchema.parse(request.query.month) : undefined;
    const { start, end } = getMonthRange(month);

    const ideas = await prisma.contentIdea.findMany({
      where: {
        date: {
          gte: start,
          lt: end
        }
      },
      include: {
        createdBy: true
      },
      orderBy: [
        {
          date: "asc"
        },
        {
          createdAt: "asc"
        }
      ]
    });

    response.json({
      data: ideas.map(serializeContentIdea)
    });
  } catch (error) {
    next(error);
  }
});

contentIdeasRouter.post("/", requireRole("admin"), async (request, response, next) => {
  try {
    const payload = upsertContentIdeaSchema.parse(request.body);
    const currentUser = response.locals.currentUser;

    const idea = await prisma.contentIdea.create({
      data: {
        date: parseDateOnly(payload.date),
        title: payload.title,
        description: payload.description || null,
        createdById: currentUser.id
      },
      include: {
        createdBy: true
      }
    });

    response.status(201).json({
      data: serializeContentIdea(idea)
    });
  } catch (error) {
    next(error);
  }
});

contentIdeasRouter.patch("/:ideaId", requireRole("admin"), async (request, response, next) => {
  try {
    const { ideaId } = request.params;
    const payload = upsertContentIdeaSchema.parse(request.body);
    const existingIdea = await prisma.contentIdea.findUnique({
      where: {
        id: ideaId
      }
    });

    if (!existingIdea) {
      response.status(404).json({
        message: "Content idea not found"
      });
      return;
    }

    const idea = await prisma.contentIdea.update({
      where: {
        id: ideaId
      },
      data: {
        date: parseDateOnly(payload.date),
        title: payload.title,
        description: payload.description || null
      },
      include: {
        createdBy: true
      }
    });

    response.json({
      data: serializeContentIdea(idea)
    });
  } catch (error) {
    next(error);
  }
});

contentIdeasRouter.delete("/:ideaId", requireRole("admin"), async (request, response, next) => {
  try {
    const { ideaId } = request.params;
    const existingIdea = await prisma.contentIdea.findUnique({
      where: {
        id: ideaId
      }
    });

    if (!existingIdea) {
      response.status(404).json({
        message: "Content idea not found"
      });
      return;
    }

    await prisma.contentIdea.delete({
      where: {
        id: ideaId
      }
    });

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});
