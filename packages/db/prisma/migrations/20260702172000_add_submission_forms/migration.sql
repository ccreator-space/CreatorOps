CREATE TYPE "FormQuestionType" AS ENUM ('text', 'textarea', 'range', 'media', 'url', 'email', 'number', 'select', 'checkbox');

CREATE TABLE "SubmissionForm" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "seriesType" "SubmissionType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionForm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubmissionFormQuestion" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "type" "FormQuestionType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "placeholder" TEXT,
    "helpText" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionFormQuestion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Submission" ADD COLUMN "formId" TEXT;
ALTER TABLE "SubmissionAttachment" ADD COLUMN "questionKey" TEXT;

CREATE UNIQUE INDEX "SubmissionForm_slug_key" ON "SubmissionForm"("slug");
CREATE INDEX "SubmissionForm_seriesType_idx" ON "SubmissionForm"("seriesType");
CREATE INDEX "SubmissionForm_isActive_idx" ON "SubmissionForm"("isActive");

CREATE UNIQUE INDEX "SubmissionFormQuestion_formId_key_key" ON "SubmissionFormQuestion"("formId", "key");
CREATE INDEX "SubmissionFormQuestion_formId_idx" ON "SubmissionFormQuestion"("formId");

CREATE INDEX "Submission_formId_idx" ON "Submission"("formId");

ALTER TABLE "Submission" ADD CONSTRAINT "Submission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "SubmissionForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubmissionFormQuestion" ADD CONSTRAINT "SubmissionFormQuestion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "SubmissionForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "SubmissionForm" ("id", "slug", "title", "description", "seriesType", "isActive", "createdAt", "updatedAt") VALUES
('form-builder-spotlight', 'builder-spotlight', 'Builder Spotlight', 'Toplulukta öne çıkarmamızı istediğin builder hikayeni paylaş.', 'builder_spotlight', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-project-highlight', 'project-highlight', 'Project Highlight', 'Üzerinde çalıştığın projeyi topluluğa anlatmamız için detayları gönder.', 'project_highlight', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-readme-book', 'readme-book', 'README Kitap Önerisi', 'README serisi için önerdiğin kitabı ve neden önemli olduğunu anlat.', 'readme_book', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "SubmissionFormQuestion" ("id", "formId", "key", "label", "type", "required", "sortOrder", "placeholder", "config", "createdAt", "updatedAt") VALUES
('question-builder-photo', 'form-builder-spotlight', 'profileMedia', 'Profil fotoğrafı ve destekleyici görseller', 'media', false, 0, NULL, '{"maxFiles":3,"allowedMimeTypes":["image/jpeg","image/png","image/webp","application/pdf"]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-builder-bio', 'form-builder-spotlight', 'bio', 'Bio', 'textarea', true, 1, 'Kendini birkaç paragrafla anlat', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-builder-title', 'form-builder-spotlight', 'title', 'Ünvan', 'text', true, 2, 'Founder, developer, designer...', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-builder-company', 'form-builder-spotlight', 'company', 'Çalıştığın yer', 'text', false, 3, 'Şirket, topluluk veya solo', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-builder-working-on', 'form-builder-spotlight', 'workingOn', 'Üzerine uğraştığın şeyler', 'textarea', true, 4, 'Şu aralar ne inşa ediyorsun?', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-builder-links', 'form-builder-spotlight', 'links', 'Öne çıkarmak istediğin linkler', 'textarea', false, 5, 'Website, GitHub, X, portfolio...', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-project-media', 'form-project-highlight', 'projectMedia', 'Proje görselleri, ekran görüntüleri veya PDF', 'media', false, 0, NULL, '{"maxFiles":10,"allowedMimeTypes":["image/jpeg","image/png","image/webp","application/pdf"]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-project-name', 'form-project-highlight', 'projectName', 'Proje adı', 'text', true, 1, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-project-problem', 'form-project-highlight', 'problem', 'Projenin çözdüğü problem', 'textarea', true, 2, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-project-description', 'form-project-highlight', 'description', 'Proje açıklaması', 'textarea', true, 3, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-project-url', 'form-project-highlight', 'projectUrl', 'Proje linki', 'url', false, 4, 'https://...', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-project-github', 'form-project-highlight', 'githubUrl', 'GitHub veya demo linki', 'url', false, 5, 'https://...', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-project-tech', 'form-project-highlight', 'techStack', 'Kullanılan teknolojiler', 'textarea', false, 6, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-project-audience', 'form-project-highlight', 'targetAudience', 'Hedef kullanıcı', 'textarea', false, 7, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-project-stage', 'form-project-highlight', 'stage', 'Projenin aşaması', 'text', false, 8, 'Fikir, MVP, yayında, büyüyor...', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-readme-media', 'form-readme-book', 'bookMedia', 'Kitap kapağı, not görseli veya PDF', 'media', false, 0, NULL, '{"maxFiles":3,"allowedMimeTypes":["image/jpeg","image/png","image/webp","application/pdf"]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-readme-name', 'form-readme-book', 'bookName', 'Kitap adı', 'text', true, 1, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-readme-author', 'form-readme-book', 'author', 'Yazar', 'text', true, 2, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-readme-why', 'form-readme-book', 'whyRecommended', 'Neden öneriyorsun?', 'textarea', true, 3, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-readme-topic', 'form-readme-book', 'bookTopic', 'Kitabın konusu', 'textarea', true, 4, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-readme-audience', 'form-readme-book', 'targetAudience', 'Kimler okumalı?', 'textarea', false, 5, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-readme-idea', 'form-readme-book', 'favoriteIdea', 'Kitaptan sevdiğin bir fikir', 'textarea', false, 6, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('question-readme-link', 'form-readme-book', 'bookLink', 'Kitap linki', 'url', false, 7, 'https://...', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
