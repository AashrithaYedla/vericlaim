import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

function dashboardFor(role) {
  if (role === "admin") return "/admin";
  if (role === "department_officer") return "/officer";
  return "/app";
}

export default function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [previewUrl, setPreviewUrl] = useState(params.get("preview") || "");
  const [devCode, setDevCode] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => email.trim() && /^\d{6}$/.test(code.trim()), [email, code]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    setBusy(true);
    try {
      const user = await verifyEmail(email.trim(), code.trim());
      nav(dashboardFor(user.role));
    } catch (ex) {
      setErr(ex.response?.data?.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setErr("");
    setInfo("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/resend-otp", { email: email.trim().toLowerCase() });
      setInfo(data.message || "A new code was sent to your email.");
      if (data.emailPreviewUrl) setPreviewUrl(data.emailPreviewUrl);
      if (data.devCode) setDevCode(data.devCode);
    } catch (ex) {
      setErr(ex.response?.data?.message || "Could not resend code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8 shadow-xl">
        <h1 className="font-display text-2xl font-bold text-white">Verify email</h1>
        <p className="mt-1 text-sm text-white/70">
          Enter the 6-digit code sent to your email. Unverified accounts cannot log in.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {err && <p className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{err}</p>}
          {info && <p className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100">{info}</p>}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-slate-900 outline-none"
            placeholder="Email"
          />
          <input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-center text-xl tracking-[0.4em] text-slate-900 outline-none"
            placeholder="------"
          />
          <button
            type="submit"
            disabled={busy || !canSubmit}
            className="w-full rounded-full bg-accent py-3 font-semibold text-primary hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify & continue"}
          </button>
        </form>
        <button
          type="button"
          disabled={busy || !email.trim()}
          onClick={resend}
          className="mt-3 w-full text-sm text-accent hover:underline disabled:opacity-50"
        >
          Resend verification code
        </button>
        {(previewUrl || devCode) && (
          <div className="mt-4 rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white/75">
            <p className="font-semibold text-white/90">Local email delivery</p>
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="mt-1 block text-accent hover:underline">
                Open email preview inbox
              </a>
            )}
            {devCode && <p className="mt-1">Dev code: {devCode}</p>}
          </div>
        )}
        <p className="mt-4 text-center text-sm text-white/70">
          Already verified?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
