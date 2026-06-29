export type UserRole = "admin" | "user";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
};

export const users: UserSummary[] = [
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

export const calendarAssignments = [
  {
    id: "assignment-1",
    date: "2026-07-03",
    user: users[0]
  },
  {
    id: "assignment-2",
    date: "2026-07-08",
    user: users[1]
  },
  {
    id: "assignment-3",
    date: "2026-07-17",
    user: users[2]
  }
];
