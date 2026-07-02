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
  readme_book: "README Kitap Önerisi"
};

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  new: "Yeni",
  assigned: "Atandı",
  in_progress: "İşleniyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  archived: "Arşivlendi"
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
    description: "Toplulukta öne çıkarmamızı istediğin builder hikayeni paylaş.",
    maxFiles: 3,
    mediaLabel: "Profil fotoğrafı ve destekleyici görseller",
    fields: [
      {
        key: "photoContext",
        label: "Fotoğraf için not",
        type: "text",
        placeholder: "Hangi fotoğrafı kullanmamızı istersin?"
      },
      {
        key: "bio",
        label: "Bio",
        type: "textarea",
        required: true,
        placeholder: "Kendini birkaç paragrafla anlat"
      },
      {
        key: "title",
        label: "Ünvan",
        type: "text",
        required: true,
        placeholder: "Founder, developer, designer..."
      },
      {
        key: "company",
        label: "Çalıştığın yer",
        type: "text",
        placeholder: "Şirket, topluluk veya solo"
      },
      {
        key: "workingOn",
        label: "Üzerine uğraştığın şeyler",
        type: "textarea",
        required: true,
        placeholder: "Şu aralar ne inşa ediyorsun?"
      },
      {
        key: "links",
        label: "Öne çıkarmak istediğin linkler",
        type: "textarea",
        placeholder: "Website, GitHub, X, portfolio..."
      }
    ]
  },
  project_highlight: {
    title: "Project Highlight",
    description: "Üzerinde çalıştığın projeyi topluluğa anlatmamız için detayları gönder.",
    maxFiles: 10,
    mediaLabel: "Proje görselleri, ekran görüntüleri veya PDF",
    fields: [
      {
        key: "projectName",
        label: "Proje adı",
        type: "text",
        required: true
      },
      {
        key: "problem",
        label: "Projenin çözdüğü problem",
        type: "textarea",
        required: true
      },
      {
        key: "description",
        label: "Proje açıklaması",
        type: "textarea",
        required: true
      },
      {
        key: "projectUrl",
        label: "Proje linki",
        type: "url",
        placeholder: "https://..."
      },
      {
        key: "githubUrl",
        label: "GitHub veya demo linki",
        type: "url",
        placeholder: "https://..."
      },
      {
        key: "techStack",
        label: "Kullanılan teknolojiler",
        type: "textarea"
      },
      {
        key: "targetAudience",
        label: "Hedef kullanıcı",
        type: "textarea"
      },
      {
        key: "stage",
        label: "Projenin aşaması",
        type: "text",
        placeholder: "Fikir, MVP, yayında, büyüyor..."
      }
    ]
  },
  readme_book: {
    title: "README Kitap Önerisi",
    description: "README serisi için önerdiğin kitabı ve neden önemli olduğunu anlat.",
    maxFiles: 3,
    mediaLabel: "Kitap kapağı, not görseli veya PDF",
    fields: [
      {
        key: "bookName",
        label: "Kitap adı",
        type: "text",
        required: true
      },
      {
        key: "author",
        label: "Yazar",
        type: "text",
        required: true
      },
      {
        key: "whyRecommended",
        label: "Neden öneriyorsun?",
        type: "textarea",
        required: true
      },
      {
        key: "bookTopic",
        label: "Kitabın konusu",
        type: "textarea",
        required: true
      },
      {
        key: "targetAudience",
        label: "Kimler okumalı?",
        type: "textarea"
      },
      {
        key: "favoriteIdea",
        label: "Kitaptan sevdiğin bir fikir",
        type: "textarea"
      },
      {
        key: "bookLink",
        label: "Kitap linki",
        type: "url",
        placeholder: "https://..."
      }
    ]
  }
};
