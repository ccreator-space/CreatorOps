import type { DragEvent } from "react";
import type { UserSummary } from "../lib/mock-data";

type AvatarStackProps = {
  users: UserSummary[];
};

export function AvatarStack({ users }: AvatarStackProps) {
  const handleDragStart = (event: DragEvent<HTMLButtonElement>, userId: string) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-shipin-user-id", userId);
    event.dataTransfer.setData("text/plain", userId);
  };

  return (
    <div className="avatar-stack" aria-label="Kayıtlı kullanıcılar">
      {users.map((user) => (
        <button
          className="avatar-button"
          draggable
          key={user.id}
          onDragStart={(event) => handleDragStart(event, user.id)}
          title={user.name}
          type="button"
        >
          <img alt={user.name} src={user.avatarUrl ?? ""} />
        </button>
      ))}
    </div>
  );
}
