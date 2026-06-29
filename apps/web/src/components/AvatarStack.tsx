import type { UserSummary } from "../lib/mock-data";

type AvatarStackProps = {
  users: UserSummary[];
};

export function AvatarStack({ users }: AvatarStackProps) {
  return (
    <div className="avatar-stack" aria-label="Kayıtlı kullanıcılar">
      {users.map((user) => (
        <button
          className="avatar-button"
          draggable
          key={user.id}
          title={user.name}
          type="button"
        >
          <img alt={user.name} src={user.avatarUrl} />
        </button>
      ))}
    </div>
  );
}
