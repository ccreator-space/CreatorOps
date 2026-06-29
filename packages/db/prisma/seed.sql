insert into "User" ("id", "name", "email", "role", "avatarUrl", "createdAt", "updatedAt")
values
  ('user-1', 'Deniz Kara', 'deniz@shipin.local', 'admin', 'https://api.dicebear.com/9.x/initials/svg?seed=Deniz%20Kara', now(), now()),
  ('user-2', 'Ece Yılmaz', 'ece@shipin.local', 'user', 'https://api.dicebear.com/9.x/initials/svg?seed=Ece%20Y%C4%B1lmaz', now(), now()),
  ('user-3', 'Mert Şahin', 'mert@shipin.local', 'user', 'https://api.dicebear.com/9.x/initials/svg?seed=Mert%20%C5%9Eahin', now(), now())
on conflict ("email") do nothing;
