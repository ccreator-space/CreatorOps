import { Prisma, prisma } from "@shipin/db";
import { Router, type Request } from "express";
import { z } from "zod";
import { postUpload } from "../middleware/upload.js";
import { saveUpload } from "../services/uploads.js";
import { serializeSubmission } from "../services/submissions.js";

export const publicSubmissionsRouter = Router();

const submissionTypeSchema = z.enum(["builder_spotlight", "project_highlight", "readme_book"]);

const publicSubmissionSchema = z.object({
  type: submissionTypeSchema,
  submitterFirstName: z.string().trim().min(1),
  submitterLastName: z.string().trim().min(1),
  submitterEmail: z.string().trim().email(),
  submitterLinkedin: z.string().trim().url(),
  note: z.string().trim().optional(),
  payload: z.string().min(2)
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

function parsePayload(value: string): Prisma.InputJsonObject {
  let payload: unknown;

  try {
    payload = JSON.parse(value) as unknown;
  } catch {
    throw new Error("INVALID_SUBMISSION_PAYLOAD");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("INVALID_SUBMISSION_PAYLOAD");
  }

  return payload as Prisma.InputJsonObject;
}

function getMaxFiles(type: z.infer<typeof submissionTypeSchema>) {
  if (type === "project_highlight") {
    return 10;
  }

  return 3;
}

publicSubmissionsRouter.post("/", postUpload.array("attachments", 10), async (request, response, next) => {
  try {
    const payload = publicSubmissionSchema.parse(request.body);
    let parsedPayload: Prisma.InputJsonObject;

    try {
      parsedPayload = parsePayload(payload.payload);
    } catch {
      response.status(400).json({
        message: "Submission payload must be a valid object"
      });
      return;
    }
    const files = getUploadedFiles(request);
    const maxFiles = getMaxFiles(payload.type);

    if (files.length > maxFiles) {
      response.status(400).json({
        message: `${payload.type} submissions can include up to ${maxFiles} attachments`
      });
      return;
    }

    const seriesAssignments = await prisma.submissionSeriesAssignment.findMany({
      where: {
        seriesType: payload.type
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
        type: payload.type,
        status: firstAssignment ? "assigned" : "new",
        submitterFirstName: payload.submitterFirstName,
        submitterLastName: payload.submitterLastName,
        submitterEmail: payload.submitterEmail,
        submitterLinkedin: payload.submitterLinkedin,
        note: payload.note || undefined,
        payload: parsedPayload,
        assignedToId: firstAssignment?.userId,
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
