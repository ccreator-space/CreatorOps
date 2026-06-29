export type UserRole = "admin" | "user";

export type UserSummary = {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
};

export const currentViewer: UserSummary = {
  id: "user-1",
  name: "Deniz Kara",
  role: "admin",
  avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Deniz%20Kara"
};

export const users: UserSummary[] = [
  currentViewer,
  {
    id: "user-2",
    name: "Ece Yılmaz",
    role: "user",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Ece%20Yilmaz"
  },
  {
    id: "user-3",
    name: "Mert Şahin",
    role: "user",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Mert%20Sahin"
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

