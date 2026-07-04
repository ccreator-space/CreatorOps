import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CreatorCredit } from "../../components/CreatorCredit";
import { useAppSettings } from "../settings/AppSettingsProvider";
import { useAuth } from "./AuthProvider";

export function SetupAdminPage() {
  const { bootstrapAdmin } = useAuth();
  const { logoSrc } = useAppSettings();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error("Name, email, and password are required.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await bootstrapAdmin({
        name,
        email,
        password
      });
      toast.success("Admin account created.");
      navigate("/calendar", {
        replace: true
      });
    } catch {
      toast.error("Admin account could not be created.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={handleSubmit}>
        <div className="brand">
          <img className="brand-logo" src={logoSrc} alt="Site logo" />
        </div>

        <div>
          <h1>Create admin</h1>
          <p className="panel-copy">Set up the first administrator account for this workspace.</p>
        </div>

        <label>
          Name
          <input
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            type="text"
          />
        </label>

        <label>
          Email
          <input
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
          />
        </label>

        <label>
          Password
          <input
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
          />
        </label>

        <label>
          Confirm password
          <input
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
          />
        </label>

        <button className="primary-button is-full" type="submit" disabled={isSubmitting}>
          <UserPlus size={18} />
          {isSubmitting ? "Creating admin..." : "Create admin"}
        </button>
      </form>
      <CreatorCredit />
    </main>
  );
}
