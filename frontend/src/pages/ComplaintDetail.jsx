import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api.js";
import ComplaintStages from "../components/ComplaintStages.jsx";
import MessageThread from "../components/MessageThread.jsx";
import { connectSocket } from "../services/socket.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ComplaintDetail({ basePath = "/app" }) {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [c, setC] = useState(null);
  const [err, setErr] = useState("");
  const [adminForm, setAdminForm] = useState({
    status: "",
    departmentId: "",
    assignedOfficer: "",
    note: "",
    release: false,
  });
  const [officerNote, setOfficerNote] = useState("");
  const [depts, setDepts] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [progressFile, setProgressFile] = useState(null);

  const load = async () => {
    const { data } = await api.get(`/complaints/${id}`);
    setC(data.complaint);
    setAdminForm((f) => ({
      ...f,
      status: data.complaint.status,
      departmentId: data.complaint.department?._id || "",
      assignedOfficer: data.complaint.assignedOfficer?._id || "",
    }));
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        setErr("Could not load complaint");
      }
    })();
  }, [id]);

  useEffect(() => {
    const socket = connectSocket(token);
    if (!socket) return;
    socket.emit("complaint:join", id);
    const onUp = () => load();
    socket.on("complaint:updated", onUp);
    return () => {
      socket.emit("complaint:leave", id);
      socket.off("complaint:updated", onUp);
      socket.disconnect();
    };
  }, [id, token]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    (async () => {
      const [d, o] = await Promise.all([api.get("/departments"), api.get("/users/officers")]);
      setDepts(d.data.departments || []);
      setOfficers(o.data.officers || []);
    })();
  }, [user?.role]);

  const saveAdmin = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("status", adminForm.status);
    if (adminForm.departmentId) fd.append("departmentId", adminForm.departmentId);
    if (adminForm.assignedOfficer) fd.append("assignedOfficer", adminForm.assignedOfficer);
    fd.append("note", adminForm.note);
    if (adminForm.release) fd.append("releaseFromSuspicious", "true");
    if (progressFile) fd.append("progressImage", progressFile);
    await api.patch(`/complaints/${id}/admin`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    setProgressFile(null);
    await load();
  };

  const officerAction = async (payload) => {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v != null && v !== "") fd.append(k, v);
    });
    if (progressFile) fd.append("progressImage", progressFile);
    await api.patch(`/complaints/${id}/officer`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    setProgressFile(null);
    setOfficerNote("");
    await load();
  };

  if (err || !c) {
    return (
      <p className="text-slate-500">
        {err || "Loading…"}{" "}
        <Link to={basePath} className="text-accent">
          Back
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to={basePath} className="text-sm text-accent hover:underline">
            ← Back
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold dark:text-white">{c.title}</h1>
          <p className="font-mono text-sm text-slate-500">{c.ticketId}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize dark:bg-slate-800">
          {c.status?.replace(/_/g, " ")}
        </span>
      </div>

      <ComplaintStages status={c.status} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold dark:text-white">Details</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{c.description}</p>
          {c.location && (
            <p className="text-sm">
              <span className="font-medium">Location:</span> {c.location}
            </p>
          )}
          {c.imageUrl && (
            <img src={c.imageUrl} alt="Evidence" className="max-h-72 rounded-xl border border-slate-200 object-contain" />
          )}
          <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/80">
            <p className="font-semibold text-slate-800 dark:text-slate-100">AI summary</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Category: <span className="capitalize">{c.category?.replace(/_/g, " ")}</span> (
              {(c.aiResult?.categoryConfidence * 100 || 0).toFixed(0)}% conf.)
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Text risk: {(c.aiResult?.textFakeScore * 100 || 0).toFixed(0)}% · Image risk:{" "}
              {(c.aiResult?.imageFakeScore * 100 || 0).toFixed(0)}%
            </p>
            {c.aiResult?.reasons?.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs text-slate-500">
                {c.aiResult.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold dark:text-white">Department</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{c.department?.name || c.departmentName || "—"}</p>
            {c.assignedOfficer && (
              <p className="mt-2 text-sm">
                Officer: {c.assignedOfficer.name} · {c.assignedOfficer.phone || c.assignedOfficer.email}
              </p>
            )}
          </div>
          {user?.role === "admin" && (
            <form onSubmit={saveAdmin} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold dark:text-white">Admin actions</h3>
              <select
                value={adminForm.status}
                onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                {[
                  "submitted",
                  "ai_verification",
                  "assigned",
                  "in_progress",
                  "resolved",
                  "closed",
                  "suspicious",
                  "rejected_fake",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={adminForm.departmentId}
                onChange={(e) => setAdminForm({ ...adminForm, departmentId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Department…</option>
                {depts.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={adminForm.assignedOfficer}
                onChange={(e) => setAdminForm({ ...adminForm, assignedOfficer: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Assign officer…</option>
                {officers.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name} ({o.department?.name})
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={adminForm.release}
                  onChange={(e) => setAdminForm({ ...adminForm, release: e.target.checked })}
                />
                Release from suspicious / fake hold
              </label>
              <input
                value={adminForm.note}
                onChange={(e) => setAdminForm({ ...adminForm, note: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                placeholder="Note for timeline"
              />
              <input type="file" accept="image/*" onChange={(e) => setProgressFile(e.target.files?.[0] || null)} />
              <button type="submit" className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white">
                Save
              </button>
            </form>
          )}
          {user?.role === "department_officer" && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold dark:text-white">Officer</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => officerAction({ action: "accept", note: officerNote })}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => officerAction({ action: "reject", note: officerNote })}
                  className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => officerAction({ status: "resolved", note: officerNote })}
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                >
                  Mark resolved
                </button>
              </div>
              <input
                value={officerNote}
                onChange={(e) => setOfficerNote(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                placeholder="Note"
              />
              <input type="file" accept="image/*" onChange={(e) => setProgressFile(e.target.files?.[0] || null)} />
              <button
                type="button"
                onClick={() => officerAction({ note: officerNote })}
                className="w-full rounded-lg border border-slate-300 py-2 text-xs dark:border-slate-600"
              >
                Upload proof only
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold dark:text-white">Timeline</h2>
        <ol className="relative border-l border-slate-200 dark:border-slate-700">
          {(c.timeline || []).map((t) => (
            <li key={t._id} className="mb-6 ml-4">
              <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-accent dark:border-slate-900" />
              <p className="text-sm font-medium dark:text-slate-100">{t.label}</p>
              <time className="text-xs text-slate-500">{new Date(t.at).toLocaleString()}</time>
              {t.note && <p className="text-sm text-slate-600 dark:text-slate-400">{t.note}</p>}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h2 className="mb-3 font-semibold dark:text-white">Messages</h2>
        <MessageThread complaintId={id} />
      </div>
    </div>
  );
}
