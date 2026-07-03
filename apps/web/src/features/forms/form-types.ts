import type { SubmissionType } from "../submissions/submission-config";

export type FormQuestionType =
  | "text"
  | "textarea"
  | "range"
  | "media"
  | "url"
  | "email"
  | "number"
  | "select"
  | "checkbox";

export type FormQuestionConfig = {
  min?: number;
  max?: number;
  step?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
  options?: string[];
};

export type SubmissionFormQuestion = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  type: FormQuestionType;
  required: boolean;
  sortOrder: number;
  placeholder?: string | null;
  helpText?: string | null;
  config?: FormQuestionConfig | null;
};

export type SubmissionForm = {
  id: string;
  slug: string;
  title: string;
  description: string;
  seriesId?: string | null;
  series?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    isActive: boolean;
  } | null;
  seriesType?: SubmissionType | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  questions: SubmissionFormQuestion[];
};

export type FormsResponse = {
  data: SubmissionForm[];
};

export type FormResponse = {
  data: SubmissionForm;
};

export const questionTypeLabels: Record<FormQuestionType, string> = {
  text: "Short text",
  textarea: "Long text",
  range: "Range",
  media: "Media",
  url: "URL",
  email: "Email",
  number: "Number",
  select: "Select",
  checkbox: "Checkbox"
};

export const mediaMimeOptions = [
  {
    label: "JPEG",
    value: "image/jpeg"
  },
  {
    label: "PNG",
    value: "image/png"
  },
  {
    label: "WEBP",
    value: "image/webp"
  },
  {
    label: "PDF",
    value: "application/pdf"
  },
  {
    label: "GIF",
    value: "image/gif"
  },
  {
    label: "SVG",
    value: "image/svg+xml"
  }
];
