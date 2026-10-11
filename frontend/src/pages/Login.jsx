import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function dashboardFor(role) {
  if (role === "admin") return "/admin";
  if (role === "department_officer") return "/officer";
  return "/app";
}

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const from = loc.state?.from;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      nav(from || dashboardFor(user.role));
    } catch (ex) {
      if (ex.requiresVerification) {
        const q = new URLSearchParams({ email: ex.email || email.trim() });
        if (ex.emailPreviewUrl) q.set("preview", ex.emailPreviewUrl);
        nav(`/verify-email?${q.toString()}`);
        return;
      }
      const msg =
        ex.response?.data?.message ||
        (ex.code === "ERR_NETWORK" ? "Cannot reach server. Is the backend running?" : null) ||
        "Could not log in. Use a registered, verified email and the correct password.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8 shadow-xl">
        <h1 className="font-display text-2xl font-bold text-white">Secure login</h1>
        <p className="mt-1 text-sm text-white/70">
          Only registered accounts with a verified email can sign in.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {err && <p className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{err}</p>}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-slate-900 outline-none"
            placeholder="Verified email"
          />
          <input
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-slate-900 outline-none"
            placeholder="Password"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-accent py-3 font-semibold text-primary hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ? "Checking credentials…" : "Sign in"}
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white/75">
          <p className="font-semibold text-white/90">Security checks</p>
          <p className="mt-1">• Password is checked against a bcrypt hash (not stored in plain text)</p>
          <p>• Email must be verified with a one-time code</p>
          <p>• Account locks after 5 failed attempts</p>
          <p>• Fake / disposable emails are rejected on register</p>
        </div>

        <p className="mt-4 text-center text-sm text-white/70">
          Need an account?{" "}
          <Link to="/register-user" className="font-medium text-accent hover:underline">
            Register & verify email
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-white/70">
          Have a code already?{" "}
          <Link to="/verify-email" className="font-medium text-accent hover:underline">
            Verify email
          </Link>
        </p>
        <Link to="/" className="mt-6 block text-center text-xs text-white/60 hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
