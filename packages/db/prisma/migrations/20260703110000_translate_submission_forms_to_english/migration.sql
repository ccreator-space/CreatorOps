UPDATE "SubmissionForm"
SET
  "title" = CASE "id"
    WHEN 'form-builder-spotlight' THEN 'Builder Spotlight'
    WHEN 'form-project-highlight' THEN 'Project Highlight'
    WHEN 'form-readme-book' THEN 'README Book Recommendation'
    ELSE "title"
  END,
  "description" = CASE "id"
    WHEN 'form-builder-spotlight' THEN 'Share the builder story you want us to feature in the community.'
    WHEN 'form-project-highlight' THEN 'Send the details we need to showcase the project you''re working on to the community.'
    WHEN 'form-readme-book' THEN 'Tell us which book you''re recommending for the README series and why it matters.'
    ELSE "description"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN ('form-builder-spotlight', 'form-project-highlight', 'form-readme-book');

UPDATE "SubmissionFormQuestion"
SET
  "label" = CASE "id"
    WHEN 'question-builder-photo' THEN 'Profile photo and supporting visuals'
    WHEN 'question-builder-bio' THEN 'Bio'
    WHEN 'question-builder-title' THEN 'Title'
    WHEN 'question-builder-company' THEN 'Where you work'
    WHEN 'question-builder-working-on' THEN 'What you''re working on'
    WHEN 'question-builder-links' THEN 'Links you''d like us to feature'
    WHEN 'question-project-media' THEN 'Project visuals, screenshots, or PDF'
    WHEN 'question-project-name' THEN 'Project name'
    WHEN 'question-project-problem' THEN 'Problem your project solves'
    WHEN 'question-project-description' THEN 'Project description'
    WHEN 'question-project-url' THEN 'Project link'
    WHEN 'question-project-github' THEN 'GitHub or demo link'
    WHEN 'question-project-tech' THEN 'Technologies used'
    WHEN 'question-project-audience' THEN 'Target audience'
    WHEN 'question-project-stage' THEN 'Project stage'
    WHEN 'question-readme-media' THEN 'Book cover, notes image, or PDF'
    WHEN 'question-readme-name' THEN 'Book title'
    WHEN 'question-readme-author' THEN 'Author'
    WHEN 'question-readme-why' THEN 'Why are you recommending it?'
    WHEN 'question-readme-topic' THEN 'What is the book about?'
    WHEN 'question-readme-audience' THEN 'Who should read it?'
    WHEN 'question-readme-idea' THEN 'A favorite idea from the book'
    WHEN 'question-readme-link' THEN 'Book link'
    ELSE "label"
  END,
  "placeholder" = CASE "id"
    WHEN 'question-builder-bio' THEN 'Tell us about yourself in a few paragraphs'
    WHEN 'question-builder-title' THEN 'Founder, developer, designer...'
    WHEN 'question-builder-company' THEN 'Company, community, or solo'
    WHEN 'question-builder-working-on' THEN 'What are you building these days?'
    WHEN 'question-builder-links' THEN 'Website, GitHub, X, portfolio...'
    WHEN 'question-project-url' THEN 'https://...'
    WHEN 'question-project-github' THEN 'https://...'
    WHEN 'question-project-stage' THEN 'Idea, MVP, live, growing...'
    WHEN 'question-readme-link' THEN 'https://...'
    ELSE "placeholder"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN (
  'question-builder-photo',
  'question-builder-bio',
  'question-builder-title',
  'question-builder-company',
  'question-builder-working-on',
  'question-builder-links',
  'question-project-media',
  'question-project-name',
  'question-project-problem',
  'question-project-description',
  'question-project-url',
  'question-project-github',
  'question-project-tech',
  'question-project-audience',
  'question-project-stage',
  'question-readme-media',
  'question-readme-name',
  'question-readme-author',
  'question-readme-why',
  'question-readme-topic',
  'question-readme-audience',
  'question-readme-idea',
  'question-readme-link'
);
