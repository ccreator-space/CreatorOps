import { LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("deniz@shipin.local");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("E-posta ve şifre zorunlu.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email,
        password
      });
      toast.success("Giriş yapıldı.");
      navigate(typeof location.state?.from === "string" ? location.state.from : "/calendar", {
        replace: true
      });
    } catch {
      toast.error("E-posta veya şifre hatalı.");
    } finally {
      setIsSubmitting(false);
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
          <h1>Giriş yap</h1>
        </div>

        <label>
          E-posta
          <input
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
          />
        </label>

        <label>
          Şifre
          <input
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
          />
        </label>

        <button className="primary-button is-full" type="submit" disabled={isSubmitting}>
          <LogIn size={18} />
          {isSubmitting ? "Giriş yapılıyor" : "Giriş yap"}
        </button>
      </form>
    </main>
  );
}
