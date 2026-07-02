import type {
  Submission,
  SubmissionAttachment,
  SubmissionForm,
  SubmissionFormQuestion,
  SubmissionSeriesAssignment,
  User
} from "@shipin/db";
import { serializeUser } from "./auth.js";
import { serializeForm } from "./forms.js";

export type SubmissionWithRelations = Submission & {
  assignedTo?: User | null;
  attachments?: SubmissionAttachment[];
  form?: (SubmissionForm & { questions: SubmissionFormQuestion[] }) | null;
};

export type SeriesAssignmentWithUser = SubmissionSeriesAssignment & {
  user: User;
};

export function serializeSubmission(submission: SubmissionWithRelations) {
  return {
    id: submission.id,
    type: submission.type,
    status: submission.status,
    submitterFirstName: submission.submitterFirstName,
    submitterLastName: submission.submitterLastName,
    submitterEmail: submission.submitterEmail,
    submitterLinkedin: submission.submitterLinkedin,
    note: submission.note,
    payload: submission.payload,
    form: submission.form ? serializeForm(submission.form) : null,
    assignedTo: submission.assignedTo ? serializeUser(submission.assignedTo) : null,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    attachments:
      submission.attachments?.map((attachment) => ({
        id: attachment.id,
        type: attachment.type,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        questionKey: attachment.questionKey,
        sizeBytes: attachment.sizeBytes,
        compressedSizeBytes: attachment.compressedSizeBytes,
        width: attachment.width,
        height: attachment.height,
        publicUrl: attachment.publicUrl,
        sortOrder: attachment.sortOrder
      })) ?? []
  };
}

export function serializeSeriesAssignment(assignment: SeriesAssignmentWithUser) {
  return {
    id: assignment.id,
    seriesType: assignment.seriesType,
    user: serializeUser(assignment.user)
  };
}
