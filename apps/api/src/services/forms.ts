import { Prisma, type SubmissionForm, type SubmissionFormQuestion } from "@shipin/db";

export type FormWithQuestions = SubmissionForm & {
  questions: SubmissionFormQuestion[];
};

export function serializeQuestion(question: SubmissionFormQuestion) {
  return {
    id: question.id,
    key: question.key,
    label: question.label,
    description: question.description,
    type: question.type,
    required: question.required,
    sortOrder: question.sortOrder,
    placeholder: question.placeholder,
    helpText: question.helpText,
    config: question.config
  };
}

export function serializeForm(form: FormWithQuestions) {
  return {
    id: form.id,
    slug: form.slug,
    title: form.title,
    description: form.description,
    seriesType: form.seriesType,
    isActive: form.isActive,
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
    questions: form.questions.map(serializeQuestion)
  };
}

export function getQuestionConfig(question: SubmissionFormQuestion) {
  if (!question.config || typeof question.config !== "object" || Array.isArray(question.config)) {
    return {};
  }

  return question.config as Record<string, unknown>;
}

export function getAllowedMimeTypes(question: SubmissionFormQuestion) {
  const config = getQuestionConfig(question);
  const allowedMimeTypes = config.allowedMimeTypes;

  if (!Array.isArray(allowedMimeTypes)) {
    return ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  }

  return allowedMimeTypes.filter((item): item is string => typeof item === "string");
}

export function getMaxFiles(question: SubmissionFormQuestion) {
  const config = getQuestionConfig(question);
  const maxFiles = config.maxFiles;

  return typeof maxFiles === "number" && Number.isFinite(maxFiles) ? maxFiles : 1;
}

export function normalizeQuestionKey(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "question";
}

export function toJsonObject(value: unknown): Prisma.InputJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Prisma.InputJsonObject;
}
