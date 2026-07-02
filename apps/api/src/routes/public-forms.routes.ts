import { Prisma, prisma, type SubmissionFormQuestion } from "@shipin/db";
import { Router, type Request } from "express";
import { z } from "zod";
import { postUpload } from "../middleware/upload.js";
import {
  getAllowedMimeTypes,
  getMaxFiles,
  serializeForm,
  toJsonObject
} from "../services/forms.js";
import { serializeSubmission } from "../services/submissions.js";
import { saveUpload } from "../services/uploads.js";

export const publicFormsRouter = Router();

const submitFormSchema = z.object({
  submitterFirstName: z.string().trim().min(1),
  submitterLastName: z.string().trim().min(1),
  submitterEmail: z.string().trim().email(),
  submitterLinkedin: z.string().trim().url(),
  note: z.string().trim().optional(),
  answers: z.string().min(2)
});

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

function parseAnswers(value: string): Prisma.InputJsonObject | null {
  try {
    return toJsonObject(JSON.parse(value) as unknown);
  } catch {
    return null;
  }
}

function isEmptyAnswer(value: unknown) {
  return value === undefined || value === null || (typeof value === "string" && !value.trim());
}

function validateAnswer(question: SubmissionFormQuestion, value: unknown) {
  if (question.type === "media") {
    return true;
  }

  if (question.required && isEmptyAnswer(value)) {
    return false;
  }

  if (isEmptyAnswer(value)) {
    return true;
  }

  if (question.type === "range" || question.type === "number") {
    return Number.isFinite(Number(value));
  }

  return typeof value === "string";
}

publicFormsRouter.get("/:slug", async (request, response, next) => {
  try {
    const { slug } = request.params;

    const form = await prisma.submissionForm.findUnique({
      where: {
        slug
      },
      include: {
        questions: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    if (!form || !form.isActive) {
      response.status(404).json({
        message: "Form not found"
      });
      return;
    }

    response.json({
      data: serializeForm(form)
    });
  } catch (error) {
    next(error);
  }
});

publicFormsRouter.post("/:slug/submissions", postUpload.array("attachments", 10), async (request, response, next) => {
  try {
    const { slug } = request.params;
    const payload = submitFormSchema.parse(request.body);
    const answers = parseAnswers(payload.answers);

    if (!answers) {
      response.status(400).json({
        message: "Answers must be a valid object"
      });
      return;
    }

    const form = await prisma.submissionForm.findUnique({
      where: {
        slug
      },
      include: {
        questions: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    if (!form || !form.isActive) {
      response.status(404).json({
        message: "Form not found"
      });
      return;
    }

    const invalidQuestion = form.questions.find((question) => !validateAnswer(question, answers[question.key]));

    if (invalidQuestion) {
      response.status(400).json({
        message: `${invalidQuestion.label} is invalid`
      });
      return;
    }

    const files = getUploadedFiles(request);
    const questionKeys = files.map((_file, index) =>
      String(getArrayValue(request.body.attachmentQuestionKeys, index) ?? "")
    );
    const mediaQuestions = form.questions.filter((question) => question.type === "media");

    for (const question of mediaQuestions) {
      const filesForQuestion = files.filter((_file, index) => questionKeys[index] === question.key);

      if (question.required && !filesForQuestion.length) {
        response.status(400).json({
          message: `${question.label} is required`
        });
        return;
      }

      if (filesForQuestion.length > getMaxFiles(question)) {
        response.status(400).json({
          message: `${question.label} includes too many files`
        });
        return;
      }

      const allowedMimeTypes = getAllowedMimeTypes(question);
      const unsupportedFile = filesForQuestion.find((file) => !allowedMimeTypes.includes(file.mimetype));

      if (unsupportedFile) {
        response.status(400).json({
          message: `${question.label} includes unsupported file type`
        });
        return;
      }
    }

    const seriesAssignments = await prisma.submissionSeriesAssignment.findMany({
      where: {
        seriesType: form.seriesType
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 1
    });
    const firstAssignment = seriesAssignments[0];
    const savedUploads = await Promise.all(
      files.map((file, index) => saveUpload(file, index, "submissions"))
    );

    const submission = await prisma.submission.create({
      data: {
        formId: form.id,
        type: form.seriesType,
        status: firstAssignment ? "assigned" : "new",
        submitterFirstName: payload.submitterFirstName,
        submitterLastName: payload.submitterLastName,
        submitterEmail: payload.submitterEmail,
        submitterLinkedin: payload.submitterLinkedin,
        note: payload.note || undefined,
        payload: answers,
        assignedToId: firstAssignment?.userId,
        attachments: {
          create: files.map((file, index) => {
            const originalSize = parseOptionalNumber(getArrayValue(request.body.originalSizeBytes, index));
            const width = parseOptionalNumber(getArrayValue(request.body.width, index));
            const height = parseOptionalNumber(getArrayValue(request.body.height, index));

            return {
              questionKey: questionKeys[index] || undefined,
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

    response.status(201).json({
      data: serializeSubmission(submission)
    });
  } catch (error) {
    next(error);
  }
});
