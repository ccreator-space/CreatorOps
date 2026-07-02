import { prisma, type CalendarAssignment, type User } from "@shipin/db";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { serializeUser } from "../services/auth.js";

export const assignmentsRouter = Router();

const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional()
});

const createAssignmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userId: z.string().min(1)
});

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function getMonthRange(month?: string) {
  const selectedMonth = month ?? new Date().toISOString().slice(0, 7);
  const [year, monthIndex] = selectedMonth.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));

  return { start, end };
}

type AssignmentWithUser = CalendarAssignment & {
  user: User;
};

function serializeAssignment(assignment: AssignmentWithUser) {
  return {
    id: assignment.id,
    date: toDateOnly(assignment.date),
    user: serializeUser(assignment.user)
  };
}

assignmentsRouter.get(
  "/",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const query = monthQuerySchema.parse(request.query);
      const currentUser = response.locals.currentUser;
      const { start, end } = getMonthRange(query.month);

      const assignments = await prisma.calendarAssignment.findMany({
        where: {
          date: {
            gte: start,
            lt: end
          },
          ...(currentUser.role === "admin" ? {} : { userId: currentUser.id })
        },
        include: {
          user: true
        },
        orderBy: {
          date: "asc"
        }
      });

      response.json({
        data: assignments.map(serializeAssignment)
      });
    } catch (error) {
      next(error);
    }
  }
);

assignmentsRouter.post(
  "/",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = createAssignmentSchema.parse(request.body);
      const currentUser = response.locals.currentUser;

      if (currentUser.role !== "admin" && payload.userId !== currentUser.id) {
        response.status(403).json({
          message: "Users can only assign themselves to calendar days"
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: {
          id: payload.userId
        }
      });

      if (!user) {
        response.status(404).json({
          message: "User not found"
        });
        return;
      }

      const date = parseDateOnly(payload.date);
      const existingAssignment = await prisma.calendarAssignment.findFirst({
        where: {
          date,
          userId: payload.userId
        },
        include: {
          user: true
        }
      });

      if (existingAssignment) {
        response.json({
          data: serializeAssignment(existingAssignment)
        });
        return;
      }

      const assignment = await prisma.calendarAssignment.create({
        data: {
          date,
          userId: payload.userId
        },
        include: {
          user: true
        }
      });

      response.status(201).json({
        data: serializeAssignment(assignment)
      });
    } catch (error) {
      next(error);
    }
  }
);
