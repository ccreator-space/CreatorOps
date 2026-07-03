CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "legacyType" "SubmissionType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");
CREATE UNIQUE INDEX "Series_legacyType_key" ON "Series"("legacyType");
CREATE INDEX "Series_isActive_idx" ON "Series"("isActive");

INSERT INTO "Series" ("id", "slug", "title", "description", "isActive", "legacyType", "createdAt", "updatedAt") VALUES
('series-builder-spotlight', 'builder-spotlight', 'Builder Spotlight', 'Share the builder story you want us to feature in the community.', true, 'builder_spotlight', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('series-project-highlight', 'project-highlight', 'Project Highlight', 'Send the details we need to showcase the project you''re working on to the community.', true, 'project_highlight', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('series-readme-book', 'readme-book', 'README Book Recommendation', 'Tell us which book you''re recommending for the README series and why it matters.', true, 'readme_book', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "Submission" ADD COLUMN "seriesId" TEXT;
UPDATE "Submission"
SET "seriesId" = "Series"."id"
FROM "Series"
WHERE "Submission"."type" = "Series"."legacyType";
ALTER TABLE "Submission" ALTER COLUMN "type" DROP NOT NULL;
CREATE INDEX "Submission_seriesId_idx" ON "Submission"("seriesId");
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SubmissionForm" ADD COLUMN "seriesId" TEXT;
UPDATE "SubmissionForm"
SET "seriesId" = "Series"."id"
FROM "Series"
WHERE "SubmissionForm"."seriesType" = "Series"."legacyType";
ALTER TABLE "SubmissionForm" ALTER COLUMN "seriesType" DROP NOT NULL;
CREATE INDEX "SubmissionForm_seriesId_idx" ON "SubmissionForm"("seriesId");
ALTER TABLE "SubmissionForm" ADD CONSTRAINT "SubmissionForm_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubmissionSeriesAssignment" ADD COLUMN "seriesId" TEXT;
UPDATE "SubmissionSeriesAssignment"
SET "seriesId" = "Series"."id"
FROM "Series"
WHERE "SubmissionSeriesAssignment"."seriesType" = "Series"."legacyType";
ALTER TABLE "SubmissionSeriesAssignment" ALTER COLUMN "seriesType" DROP NOT NULL;
ALTER TABLE "SubmissionSeriesAssignment" ALTER COLUMN "seriesId" SET NOT NULL;
CREATE INDEX "SubmissionSeriesAssignment_seriesId_idx" ON "SubmissionSeriesAssignment"("seriesId");
CREATE UNIQUE INDEX "SubmissionSeriesAssignment_seriesId_userId_key" ON "SubmissionSeriesAssignment"("seriesId", "userId");
ALTER TABLE "SubmissionSeriesAssignment" ADD CONSTRAINT "SubmissionSeriesAssignment_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
