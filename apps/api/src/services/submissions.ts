import type {
  Submission,
  SubmissionAttachment,
  SubmissionForm,
  SubmissionFormQuestion,
  SubmissionSeriesAssignment,
  Series,
  User
} from "@shipin/db";
import { serializeUser } from "./auth.js";
import { serializeForm } from "./forms.js";

export type SubmissionWithRelations = Submission & {
  assignedTo?: User | null;
  attachments?: SubmissionAttachment[];
  form?: (SubmissionForm & { questions: SubmissionFormQuestion[]; series?: Series | null }) | null;
  series?: Series | null;
};

export type SeriesAssignmentWithUser = SubmissionSeriesAssignment & {
  user: User;
  series?: Series | null;
};

export function serializeSubmission(submission: SubmissionWithRelations) {
  return {
    id: submission.id,
    type: submission.type,
    seriesId: submission.seriesId,
    series: submission.series
      ? {
          id: submission.series.id,
          slug: submission.series.slug,
          title: submission.series.title,
          description: submission.series.description,
          isActive: submission.series.isActive
        }
      : null,
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
    seriesId: assignment.seriesId,
    seriesType: assignment.seriesType,
    series: assignment.series
      ? {
          id: assignment.series.id,
          slug: assignment.series.slug,
          title: assignment.series.title,
          description: assignment.series.description,
          isActive: assignment.series.isActive
        }
      : null,
    user: serializeUser(assignment.user)
  };
}
