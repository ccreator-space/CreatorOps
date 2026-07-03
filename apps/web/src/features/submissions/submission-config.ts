export type SubmissionType = "builder_spotlight" | "project_highlight" | "readme_book";

export type SubmissionStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "approved"
  | "rejected"
  | "archived";

export type SubmissionField = {
  key: string;
  label: string;
  type: "text" | "email" | "url" | "textarea";
  required?: boolean;
  placeholder?: string;
};

export const submissionTypes: SubmissionType[] = [
  "builder_spotlight",
  "project_highlight",
  "readme_book"
];

export const submissionTypeLabels: Record<SubmissionType, string> = {
  builder_spotlight: "Builder Spotlight",
  project_highlight: "Project Highlight",
  readme_book: "README Book Recommendation"
};

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived"
};

export const submissionConfigs: Record<
  SubmissionType,
  {
    title: string;
    description: string;
    maxFiles: number;
    mediaLabel: string;
    fields: SubmissionField[];
  }
> = {
  builder_spotlight: {
    title: "Builder Spotlight",
    description: "Share the builder story you want us to feature in the community.",
    maxFiles: 3,
    mediaLabel: "Profile photo and supporting visuals",
    fields: [
      {
        key: "photoContext",
        label: "Photo note",
        type: "text",
        placeholder: "Which photo would you like us to use?"
      },
      {
        key: "bio",
        label: "Bio",
        type: "textarea",
        required: true,
        placeholder: "Tell us about yourself in a few paragraphs"
      },
      {
        key: "title",
        label: "Title",
        type: "text",
        required: true,
        placeholder: "Founder, developer, designer..."
      },
      {
        key: "company",
        label: "Where you work",
        type: "text",
        placeholder: "Company, community, or solo"
      },
      {
        key: "workingOn",
        label: "What you're working on",
        type: "textarea",
        required: true,
        placeholder: "What are you building these days?"
      },
      {
        key: "links",
        label: "Links you'd like us to feature",
        type: "textarea",
        placeholder: "Website, GitHub, X, portfolio..."
      }
    ]
  },
  project_highlight: {
    title: "Project Highlight",
    description: "Send the details we need to showcase the project you're working on to the community.",
    maxFiles: 10,
    mediaLabel: "Project visuals, screenshots, or PDF",
    fields: [
      {
        key: "projectName",
        label: "Project name",
        type: "text",
        required: true
      },
      {
        key: "problem",
        label: "Problem your project solves",
        type: "textarea",
        required: true
      },
      {
        key: "description",
        label: "Project description",
        type: "textarea",
        required: true
      },
      {
        key: "projectUrl",
        label: "Project link",
        type: "url",
        placeholder: "https://..."
      },
      {
        key: "githubUrl",
        label: "GitHub or demo link",
        type: "url",
        placeholder: "https://..."
      },
      {
        key: "techStack",
        label: "Technologies used",
        type: "textarea"
      },
      {
        key: "targetAudience",
        label: "Target audience",
        type: "textarea"
      },
      {
        key: "stage",
        label: "Project stage",
        type: "text",
        placeholder: "Idea, MVP, live, growing..."
      }
    ]
  },
  readme_book: {
    title: "README Book Recommendation",
    description: "Tell us which book you're recommending for the README series and why it matters.",
    maxFiles: 3,
    mediaLabel: "Book cover, notes image, or PDF",
    fields: [
      {
        key: "bookName",
        label: "Book title",
        type: "text",
        required: true
      },
      {
        key: "author",
        label: "Author",
        type: "text",
        required: true
      },
      {
        key: "whyRecommended",
        label: "Why are you recommending it?",
        type: "textarea",
        required: true
      },
      {
        key: "bookTopic",
        label: "What is the book about?",
        type: "textarea",
        required: true
      },
      {
        key: "targetAudience",
        label: "Who should read it?",
        type: "textarea"
      },
      {
        key: "favoriteIdea",
        label: "A favorite idea from the book",
        type: "textarea"
      },
      {
        key: "bookLink",
        label: "Book link",
        type: "url",
        placeholder: "https://..."
      }
    ]
  }
};
