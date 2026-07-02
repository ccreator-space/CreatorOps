CREATE TYPE "SubmissionType" AS ENUM ('builder_spotlight', 'project_highlight', 'readme_book');

CREATE TYPE "SubmissionStatus" AS ENUM ('new', 'assigned', 'in_progress', 'approved', 'rejected', 'archived');

CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "type" "SubmissionType" NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'new',
    "submitterFirstName" TEXT NOT NULL,
    "submitterLastName" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "submitterLinkedin" TEXT NOT NULL,
    "note" TEXT,
    "payload" JSONB NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubmissionAttachment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "compressedSizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubmissionSeriesAssignment" (
    "id" TEXT NOT NULL,
    "seriesType" "SubmissionType" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionSeriesAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Submission_type_idx" ON "Submission"("type");
CREATE INDEX "Submission_status_idx" ON "Submission"("status");
CREATE INDEX "Submission_assignedToId_idx" ON "Submission"("assignedToId");
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

CREATE INDEX "SubmissionAttachment_submissionId_idx" ON "SubmissionAttachment"("submissionId");

CREATE UNIQUE INDEX "SubmissionSeriesAssignment_seriesType_userId_key" ON "SubmissionSeriesAssignment"("seriesType", "userId");
CREATE INDEX "SubmissionSeriesAssignment_seriesType_idx" ON "SubmissionSeriesAssignment"("seriesType");
CREATE INDEX "SubmissionSeriesAssignment_userId_idx" ON "SubmissionSeriesAssignment"("userId");

ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubmissionAttachment" ADD CONSTRAINT "SubmissionAttachment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubmissionSeriesAssignment" ADD CONSTRAINT "SubmissionSeriesAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
