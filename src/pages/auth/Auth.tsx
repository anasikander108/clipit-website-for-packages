import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { db, errorMessage, notify } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Logo } from "../../components/common";
import { Alert, Button, Spinner, TextField } from "../../components/ui";

/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(raw: string | null, plan?: string | null) {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  if (plan && /^[a-z0-9-]+$/.test(plan)) return `/checkout/${plan}`;
  return "/dashboard";
}

const callbackUrl = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="container-x flex h-16 items-center"><Logo /></div>
      <div className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-[420px]">
          <div className="card animate-fade-up p-7 sm:p-8">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
            {subtitle && <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <p className="mt-5 text-center text-[14px] text-muted">{footer}</p>}
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"), params.get("plan"));
  const nav = useNavigate();
  const { session, verified } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);

  if (session && verified) return <Navigate to={next} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setUnconfirmed(false);
    const { error } = await db().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      if (/not confirmed/i.test(error.message)) setUnconfirmed(true);
      else setError(/invalid login/i.test(error.message) ? "The email or password is not correct." : errorMessage(error));
      return;
    }
    nav(next, { replace: true });
  }

  return (
    <AuthLayout title="Log in" subtitle="Welcome back. Log in to manage your subscription."
      footer={<>New here? <Link className="font-medium text-ink underline-offset-4 hover:underline" to={`/register${params.get("plan") ? `?plan=${params.get("plan")}` : ""}`}>Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {unconfirmed && <ResendVerification email={email} next={next} />}
        <TextField label="Email address" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <TextField label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Link to="/forgot-password" className="mt-2 inline-block text-[13px] text-muted hover:text-ink">Forgot your password?</Link>
        </div>
        <Button type="submit" loading={busy} className="w-full">Log in</Button>
      </form>
    </AuthLayout>
  );
}

function ResendVerification({ email, next }: { email: string; next: string }) {
  const [state, setState] = useState<"idle" | "busy" | "sent" | string>("idle");
  return (
    <Alert tone="warning" title="Please verify your email first"
      action={state === "sent" ? null : (
        <Button size="sm" variant="secondary" loading={state === "busy"} onClick={async () => {
          setState("busy");
          const { error } = await db().auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: callbackUrl(next) } });
          setState(error ? errorMessage(error) : "sent");
        }}>Resend link</Button>
      )}>
      {state === "sent" ? "A new verification link is on its way." : state !== "idle" && state !== "busy" ? state : "Open the link we emailed you, then log in."}
    </Alert>
  );
}

export function Register() {
  const [params] = useSearchParams();
  const plan = params.get("plan");
  const next = safeNext(null, plan);
  const nav = useNavigate();
  const { session, verified } = useAuth();
  const [f, setF] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof f, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  if (session && verified) return <Navigate to={next} replace />;

  function validate() {
    const e: typeof errors = {};
    if (f.full_name.trim().length < 2) e.full_name = "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Please enter a valid email address.";
    if (!/^\+?[0-9][0-9\s-]{8,15}$/.test(f.phone.trim())) e.phone = "Please enter a valid phone number, e.g. 0300 1234567.";
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/[0-9]/.test(f.password)) e.password = "Use at least 8 characters with letters and numbers.";
    if (f.confirm !== f.password) e.confirm = "The passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setBusy(true);
    const email = f.email.trim().toLowerCase();
    const { data, error } = await db().auth.signUp({
      email,
      password: f.password,
      options: { data: { full_name: f.full_name.trim(), phone: f.phone.trim() }, emailRedirectTo: callbackUrl(next) },
    });
    setBusy(false);
    if (error) return setError(errorMessage(error));
    if (data.user && data.user.identities?.length === 0) return setError("An account with this email already exists. Please log in instead.");
    if (data.session) return nav(next, { replace: true }); // email confirmation switched off in Supabase
    nav(`/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`, { replace: true });
  }

  return (
    <AuthLayout title="Create your account" subtitle={plan ? "Create an account first. You will pay on the next step." : "It takes a minute. You will verify your email next."}
      footer={<>Already have an account? <Link className="font-medium text-ink underline-offset-4 hover:underline" to={`/login${plan ? `?plan=${plan}` : ""}`}>Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <TextField label="Full name" autoComplete="name" value={f.full_name} onChange={set("full_name")} error={errors.full_name} />
        <TextField label="Email address" type="email" autoComplete="email" value={f.email} onChange={set("email")} error={errors.email} hint="This becomes your permanent account identity." />
        <TextField label="Phone number" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} error={errors.phone} placeholder="0300 1234567" />
        <TextField label="Password" type="password" autoComplete="new-password" value={f.password} onChange={set("password")} error={errors.password} />
        <TextField label="Confirm password" type="password" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} error={errors.confirm} />
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
        <p className="text-center text-[12.5px] leading-relaxed text-muted">
          By creating an account you agree to the <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}

export function VerifyEmail() {
  const [params] = useSearchParams();
  const { session, verified, loading } = useAuth();
  const email = params.get("email") ?? session?.user.email ?? "";
  const next = safeNext(params.get("next"));
  const [state, setState] = useState<"idle" | "busy" | "sent" | string>("idle");
  if (!loading && session && verified) return <Navigate to={next} replace />;
  return (
    <AuthLayout title="Check your inbox">
      <div className="mb-5 grid size-11 place-items-center rounded-lg border border-line bg-paper"><MailCheck className="size-5 text-teal" /></div>
      <p className="text-[14.5px] leading-relaxed text-ink-2">
        We sent a verification link to {email ? <strong className="font-semibold">{email}</strong> : "your email address"}. Open it to activate your account; you will then continue to payment.
      </p>
      <p className="mt-3 text-[13.5px] text-muted">Not there after a few minutes? Check spam, or send a new link.</p>
      {state !== "idle" && state !== "busy" && (
        <div className="mt-4"><Alert tone={state === "sent" ? "success" : "error"}>{state === "sent" ? "A new link has been sent." : state}</Alert></div>
      )}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" disabled={!email} loading={state === "busy"} onClick={async () => {
          setState("busy");
          const { error } = await db().auth.resend({ type: "signup", email, options: { emailRedirectTo: callbackUrl(next) } });
          setState(error ? errorMessage(error) : "sent");
        }}>Resend link</Button>
        <Link to="/login" className="inline-flex h-10 items-center justify-center px-4 text-[14px] text-muted hover:text-ink">Back to log in</Link>
      </div>
    </AuthLayout>
  );
}

/** Landing page for the links in verification emails. */
export function AuthCallback() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { loading, session, verified } = useAuth();
  const next = safeNext(params.get("next"));
  const hashError = new URLSearchParams(window.location.hash.slice(1)).get("error_description");
  const error = params.get("error_description") ?? hashError;
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 4000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!loading && session && verified) {
      void notify("welcome");
      nav(next, { replace: true });
    }
  }, [loading, session, verified, next, nav]);

  if (error || (waited && !session)) {
    return (
      <AuthLayout title="This link did not work">
        <Alert tone="error">{error ?? "The link has expired or was already used."}</Alert>
        <p className="mt-4 text-[14px] text-muted">Log in to request a new verification email.</p>
        <Link to="/login" className="mt-5 inline-block text-[14px] font-medium underline">Go to log in</Link>
      </AuthLayout>
    );
  }
  return <div className="min-h-screen"><Spinner label="Verifying" /></div>;
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <AuthLayout title="Reset your password" subtitle="Enter your account email and we will send you a reset link."
      footer={<Link to="/login" className="hover:text-ink">Back to log in</Link>}>
      {sent ? (
        <Alert tone="success" title="Check your inbox">If an account exists for {email}, a password reset link is on its way.</Alert>
      ) : (
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const { error } = await db().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
          setBusy(false);
          if (error && !/not found/i.test(error.message)) setError(errorMessage(error));
          else setSent(true);
        }}>
          {error && <Alert tone="error">{error}</Alert>}
          <TextField label="Email address" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={busy} className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPassword() {
  const nav = useNavigate();
  const { loading, session } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (loading || (!session && !waited)) return <div className="min-h-screen"><Spinner /></div>;
  if (!session) {
    return (
      <AuthLayout title="Reset link expired">
        <Alert tone="error">This reset link has expired or was already used.</Alert>
        <Link to="/forgot-password" className="mt-5 inline-block text-[14px] font-medium underline">Request a new link</Link>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title="Choose a new password">
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return setError("Use at least 8 characters with letters and numbers.");
        if (password !== confirm) return setError("The passwords do not match.");
        setBusy(true);
        const { error } = await db().auth.updateUser({ password });
        setBusy(false);
        if (error) return setError(errorMessage(error));
        nav("/dashboard", { replace: true });
      }}>
        {error && <Alert tone="error">{error}</Alert>}
        <TextField label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextField label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" loading={busy} className="w-full">Update password</Button>
      </form>
    </AuthLayout>
  );
}
