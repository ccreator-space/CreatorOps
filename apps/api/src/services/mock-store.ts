export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  avatarUrl: string;
};

export type MockPost = {
  id: string;
  assigneeId: string;
  scheduledDate: string;
  platform: "linkedin" | "instagram";
  title: string;
  content: string;
  status: "draft" | "pending_review" | "approved" | "rejected" | "revision_requested";
};

export const mockUsers: MockUser[] = [
  {
    id: "user-1",
    name: "Deniz Kara",
    email: "deniz@shipin.local",
    role: "admin",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Deniz%20Kara"
  },
  {
    id: "user-2",
    name: "Ece Yılmaz",
    email: "ece@shipin.local",
    role: "user",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Ece%20Y%C4%B1lmaz"
  },
  {
    id: "user-3",
    name: "Mert Şahin",
    email: "mert@shipin.local",
    role: "user",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Mert%20%C5%9Eahin"
  }
];

export const mockPosts: MockPost[] = [
  {
    id: "post-1",
    assigneeId: "user-2",
    scheduledDate: "2026-07-08",
    platform: "linkedin",
    title: "Shipin community update",
    content: "New season social media plan.",
    status: "pending_review"
  },
  {
    id: "post-2",
    assigneeId: "user-3",
    scheduledDate: "2026-07-17",
    platform: "instagram",
    title: "Team introduction",
    content: "A short introduction from the Shipin social media team.",
    status: "revision_requested"
  }
];

export function findUserById(userId: string) {
  return mockUsers.find((user) => user.id === userId);
}
