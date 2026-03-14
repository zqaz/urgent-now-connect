import { useState } from "react";
import {
  X, Mail, Lock, LogIn, UserPlus, Loader2, Eye, EyeOff,
  CheckCircle2, XCircle, Sparkles, ArrowRight, User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/* ── Password rules ─────────────────────────────────────────────────────── */
interface PasswordRule { label: string; test: (p: string) => boolean }

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 12 characters",       test: (p) => p.length >= 12 },
  { label: "One uppercase letter (A–Z)",    test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a–z)",   test: (p) => /[a-z]/.test(p) },
  { label: "One number (0–9)",              test: (p) => /[0-9]/.test(p) },
  { label: "One special character (!@#$…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function validatePassword(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return rule.label;
  }
  return null;
}

function getInitials(email: string) {
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

/* ── Component ──────────────────────────────────────────────────────────── */
interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ModalView = "signin" | "signup" | "welcome";

const AuthModal = ({ onClose, onSuccess }: AuthModalProps) => {
  const { signIn, signUp } = useAuth();
  const [view, setView] = useState<ModalView>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchView = (v: "signin" | "signup") => {
    setView(v);
    setError(null);
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    if (view === "signup") {
      const pwErr = validatePassword(password);
      if (pwErr) { setError(`Password requirement not met: ${pwErr}`); return; }
    }

    setLoading(true);
    try {
      if (view === "signup") {
        const { error: signUpErr } = await signUp(email.trim(), password);
        if (signUpErr) throw signUpErr;

        // Immediately sign in so the demo doesn't require email confirmation.
        // If Supabase has email confirmation enabled, this will silently fail
        // and the user will see the welcome screen with a "check email" note.
        await signIn(email.trim(), password).catch(() => null);

        setView("welcome");
      } else {
        const { error: signInErr } = await signIn(email.trim(), password);
        if (signInErr) throw signInErr;
        onSuccess();
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      if (msg.includes("Invalid login credentials")) {
        setError("Incorrect email or password.");
      } else if (msg.includes("User already registered")) {
        setError("An account with this email already exists. Try signing in.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Please confirm your email address before signing in.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Welcome screen (post-signup) ─────────────────────────────────────── */
  if (view === "welcome") {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl w-full max-w-sm shadow-xl border border-border overflow-hidden">
          {/* Close */}
          <div className="flex justify-end px-4 pt-4">
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar + greeting */}
          <div className="flex flex-col items-center px-6 pb-2 pt-0 text-center">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-2xl">{getInitials(email)}</span>
              </div>
              {/* Sparkle badge */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-safe-green flex items-center justify-center border-2 border-card shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-safe-green-foreground" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground mb-1">You're all set!</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Welcome to UrgentNow
            </p>

            {/* Email pill */}
            <div className="flex items-center gap-2 bg-secondary/60 rounded-full px-4 py-2 mb-5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-medium text-foreground truncate max-w-[220px]">{email}</span>
            </div>

            {/* What's next */}
            <div className="w-full bg-primary/5 border border-primary/15 rounded-xl p-4 mb-5 text-left space-y-2.5">
              <p className="text-xs font-bold text-foreground mb-1">Next steps</p>
              {[
                { icon: <User className="w-3.5 h-3.5" />, text: "Complete your health profile (blood type, medications, allergies)" },
                { icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: "Save your insurance to skip the picker every visit" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 flex-shrink-0">{icon}</span>
                  <span className="text-xs text-muted-foreground leading-snug">{text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-md mb-2"
            >
              Set Up My Profile <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Sign-in / Sign-up form ───────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-sm shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {view === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {view === "signin"
                ? "Sign in to access your health profile"
                : "Save your profile for faster care"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["signin", "signup"] as const).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                view === v
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-3">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={view === "signin" ? "current-password" : "new-password"}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password strength checklist */}
          {view === "signup" && password.length > 0 && (
            <ul className="space-y-1 text-[11px]">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                  <li key={rule.label} className={`flex items-center gap-1.5 ${ok ? "text-safe-green" : "text-muted-foreground"}`}>
                    {ok
                      ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      : <XCircle className="w-3 h-3 flex-shrink-0" />}
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}

          {error && (
            <p className="text-xs text-alert-red bg-alert-red/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-4 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : view === "signin" ? (
              <><LogIn className="w-4 h-4" /> Sign In</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Create Account</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
