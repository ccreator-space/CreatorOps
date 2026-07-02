import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const { users, login } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedUserId) {
      login(selectedUserId);
      window.location.hash = "calendar";
    }
  };

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={handleSubmit}>
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>Shipin</span>
        </div>

        <div>
          <p className="eyebrow">Social media management</p>
          <h1>Giriş yap</h1>
        </div>

        <label>
          Kullanıcı
          <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
        </label>

        <button className="primary-button is-full" type="submit">
          <LogIn size={18} />
          Giriş yap
        </button>
      </form>
    </main>
  );
}
