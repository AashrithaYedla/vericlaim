import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterDepartmentAdmin() {
  const { registerDepartmentAdmin } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    departmentCode: "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const data = await registerDepartmentAdmin(form);
      const q = new URLSearchParams({ email: data.email || form.email });
      if (data.emailPreviewUrl) q.set("preview", data.emailPreviewUrl);
      nav(`/verify-email?${q.toString()}`);
    } catch (ex) {
      setErr(ex.response?.data?.message || "Could not register department admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8 shadow-xl">
        <h1 className="font-display text-2xl font-bold text-white">Department Admin Registration</h1>
        <p className="mt-1 text-sm text-white/70">
          Requires a valid department code and verified official email.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {err && <p className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{err}</p>}
          <input
            required
            minLength={3}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-slate-900 outline-none"
            placeholder="Full name"
          />
          <input
            required
            value={form.departmentCode}
            onChange={(e) => setForm({ ...form, departmentCode: e.target.value.toUpperCase() })}
            className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-slate-900 outline-none"
            placeholder="Department Code (SAN, WAT, ELE, ROD, PSF, MUN)"
          />
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-slate-900 outline-none"
            placeholder="Official email"
          />
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-slate-900 outline-none"
            placeholder="Password (Aa1! min 8 chars)"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-accent py-3 font-semibold text-primary hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ? "Registering…" : "Register & verify email"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-white/70">
          Back to{" "}
          <Link to="/login" className="text-accent hover:underline">
            login
          </Link>
        </p>
      </div>
    </div>
  );
}
