import { Prisma, prisma } from "@shipin/db";
import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/current-user.js";
import { normalizeQuestionKey, serializeForm, toJsonObject } from "../services/forms.js";

export const formsRouter = Router();

formsRouter.use(requireRole("admin"));

const submissionTypeSchema = z.enum(["builder_spotlight", "project_highlight", "readme_book"]);
const questionTypeSchema = z.enum([
  "text",
  "textarea",
  "range",
  "media",
  "url",
  "email",
  "number",
  "select",
  "checkbox"
]);

const formUpdateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  seriesId: z.string().min(1),
  seriesType: submissionTypeSchema.nullable().optional(),
  isActive: z.boolean()
});

const questionSchema = z.object({
  key: z.string().trim().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/).optional(),
  label: z.string().trim().min(1),
  description: z.string().trim().optional(),
  type: questionTypeSchema,
  required: z.boolean(),
  placeholder: z.string().trim().optional(),
  helpText: z.string().trim().optional(),
  config: z.unknown().optional()
});

const reorderSchema = z.object({
  questionIds: z.array(z.string().min(1))
});

function normalizeConfig(value: unknown): Prisma.InputJsonObject | undefined {
  if (!value) {
    return undefined;
  }

  return toJsonObject(value);
}

formsRouter.get("/", async (_request, response, next) => {
  try {
    const forms = await prisma.submissionForm.findMany({
      include: {
        series: true,
        questions: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    response.json({
      data: forms.map(serializeForm)
    });
  } catch (error) {
    next(error);
  }
});

formsRouter.patch("/:formId", async (request, response, next) => {
  try {
    const { formId } = request.params;
    const payload = formUpdateSchema.parse(request.body);

    const form = await prisma.submissionForm.update({
      where: {
        id: formId
      },
      data: payload,
      include: {
        series: true,
        questions: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    response.json({
      data: serializeForm(form)
    });
  } catch (error) {
    next(error);
  }
});

formsRouter.post("/:formId/questions", async (request, response, next) => {
  try {
    const { formId } = request.params;
    const payload = questionSchema.parse(request.body);
    const questionCount = await prisma.submissionFormQuestion.count({
      where: {
        formId
      }
    });

    await prisma.submissionFormQuestion.create({
      data: {
        formId,
        key: payload.key ?? `${normalizeQuestionKey(payload.label)}_${Date.now().toString(36)}`,
        label: payload.label,
        description: payload.description || undefined,
        type: payload.type,
        required: payload.required,
        placeholder: payload.placeholder || undefined,
        helpText: payload.helpText || undefined,
        config: normalizeConfig(payload.config),
        sortOrder: questionCount
      }
    });

    const form = await prisma.submissionForm.findUniqueOrThrow({
      where: {
        id: formId
      },
      include: {
        series: true,
        questions: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    response.status(201).json({
      data: serializeForm(form)
    });
  } catch (error) {
    next(error);
  }
});

formsRouter.patch("/:formId/questions/:questionId", async (request, response, next) => {
  try {
    const { formId, questionId } = request.params;
    const payload = questionSchema.parse(request.body);

    await prisma.submissionFormQuestion.update({
      where: {
        id: questionId
      },
      data: {
        key: payload.key,
        label: payload.label,
        description: payload.description || null,
        type: payload.type,
        required: payload.required,
        placeholder: payload.placeholder || null,
        helpText: payload.helpText || null,
        config: normalizeConfig(payload.config) ?? Prisma.JsonNull
      }
    });

    const form = await prisma.submissionForm.findUniqueOrThrow({
      where: {
        id: formId
      },
      include: {
        series: true,
        questions: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    response.json({
      data: serializeForm(form)
    });
  } catch (error) {
    next(error);
  }
});

formsRouter.delete("/:formId/questions/:questionId", async (request, response, next) => {
  try {
    const { formId, questionId } = request.params;

    await prisma.submissionFormQuestion.delete({
      where: {
        id: questionId
      }
    });

    const questions = await prisma.submissionFormQuestion.findMany({
      where: {
        formId
      },
      orderBy: {
        sortOrder: "asc"
      }
    });

    await Promise.all(
      questions.map((question, index) =>
        prisma.submissionFormQuestion.update({
          where: {
            id: question.id
          },
          data: {
            sortOrder: index
          }
        })
      )
    );

    const form = await prisma.submissionForm.findUniqueOrThrow({
      where: {
        id: formId
      },
      include: {
        series: true,
        questions: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    response.json({
      data: serializeForm(form)
    });
  } catch (error) {
    next(error);
  }
});

formsRouter.put("/:formId/questions/reorder", async (request, response, next) => {
  try {
    const { formId } = request.params;
    const payload = reorderSchema.parse(request.body);

    await Promise.all(
      payload.questionIds.map((questionId, index) =>
        prisma.submissionFormQuestion.update({
          where: {
            id: questionId
          },
          data: {
            sortOrder: index
          }
        })
      )
    );

    const form = await prisma.submissionForm.findUniqueOrThrow({
      where: {
        id: formId
      },
      include: {
        series: true,
        questions: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    response.json({
      data: serializeForm(form)
    });
  } catch (error) {
    next(error);
  }
});
