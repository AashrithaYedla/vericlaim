import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";

export default function NewComplaint() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [file, setFile] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageCheck, setImageCheck] = useState(null);
  const [a] = useState(() => Math.floor(Math.random() * 7) + 2);
  const [b] = useState(() => Math.floor(Math.random() * 6) + 3);
  const [captcha, setCaptcha] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (Number(captcha) !== a + b) {
        throw new Error("Captcha validation failed. Please answer correctly.");
      }
      if (file) {
        const preCheck = new FormData();
        preCheck.append("image", file);
        const aiCheck = await api.post("/ai/detect-image", preCheck, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const prediction = aiCheck.data?.prediction || "";
        const authenticityScore = Number(aiCheck.data?.authenticityScore ?? 0);
        setImageCheck({
          prediction,
          authenticityScore,
          reasons: aiCheck.data?.reasons || [],
        });
        if (prediction === "fake" || authenticityScore < 0.55) {
          throw new Error(
            "Image looks AI-generated or manipulated. Please upload a genuine complaint photo."
          );
        }
      } else {
        setImageCheck(null);
      }
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("location", location);
      fd.append("contactPhone", contactPhone);
      if (file) fd.append("image", file);
      await api.post("/complaints", fd, { headers: { "Content-Type": "multipart/form-data" } });
      nav("/app");
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold dark:text-white">Raise a complaint</h1>
        <p className="text-sm text-slate-500">Add details and optional photo evidence. AI will verify and route.</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {err && <p className="text-sm text-rose-600">{err}</p>}
        {imageCheck && !err && (
          <p className="text-sm text-emerald-600">
            Image authenticity check passed ({Math.round((imageCheck.authenticityScore || 0) * 100)}%).
          </p>
        )}
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Title"
        />
        <textarea
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Describe the issue clearly (what, where, since when)"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Location (area / landmark)"
        />
        <input
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Contact phone (optional)"
        />
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Photo evidence</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setImageCheck(null);
            }}
            className="mt-1 block w-full text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            CAPTCHA: What is {a} + {b}?
          </label>
          <input
            required
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Enter result"
          />
        </div>
        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Submit for AI review"}
        </button>
      </form>
    </div>
  );
}
