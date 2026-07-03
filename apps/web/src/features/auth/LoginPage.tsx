import { LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreatorCredit } from "../../components/CreatorCredit";
import { useAppSettings } from "../settings/AppSettingsProvider";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const { login } = useAuth();
  const { logoSrc } = useAppSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("deniz@shipin.local");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email,
        password
      });
      toast.success("Signed in.");
      navigate(typeof location.state?.from === "string" ? location.state.from : "/calendar", {
        replace: true
      });
    } catch {
      toast.error("Incorrect email or password.");
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
          <h1>Sign in</h1>
        </div>

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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
          />
        </label>

        <button className="primary-button is-full" type="submit" disabled={isSubmitting}>
          <LogIn size={18} />
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <CreatorCredit />
    </main>
  );
}
