CREATE TYPE "AttachmentType" AS ENUM ('image', 'pdf');

CREATE TABLE "PostAttachment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
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

    CONSTRAINT "PostAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PostAttachment_postId_idx" ON "PostAttachment"("postId");

ALTER TABLE "PostAttachment" ADD CONSTRAINT "PostAttachment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
