import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";
import StatCard from "../../components/StatCard.jsx";
import { connectSocket } from "../../services/socket.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function CitizenDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [deletingId, setDeletingId] = useState("");

  const load = async () => {
    const [s, c] = await Promise.all([
      api.get("/analytics/citizen"),
      api.get("/complaints/mine"),
    ]);
    setStats(s.data);
    setComplaints(c.data.complaints || []);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const socket = connectSocket(token);
    if (!socket) return;
    const onUp = () => load();
    socket.on("complaint:updated", onUp);
    socket.on("complaint:created", onUp);
    return () => {
      socket.off("complaint:updated", onUp);
      socket.off("complaint:created", onUp);
      socket.disconnect();
    };
  }, [token]);

  const deleteComplaint = async (complaint) => {
    const ok = window.confirm(`Delete complaint "${complaint.title}"? This action cannot be undone.`);
    if (!ok) return;
    setDeletingId(complaint._id);
    try {
      await api.delete(`/complaints/${complaint._id}`);
      setComplaints((prev) => prev.filter((c) => c._id !== complaint._id));
    } finally {
      setDeletingId("");
    }
  };

  const canDelete = (status) => !["in_progress", "resolved", "closed"].includes(status);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Your dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track complaints and AI outcomes.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total raised" value={stats?.total ?? "—"} tone="teal" />
        <StatCard title="Active pipeline" value={stats?.inProgress ?? "—"} hint="Not closed or flagged" tone="amber" />
        <StatCard title="Completed" value={stats?.completed ?? "—"} tone="emerald" />
        <StatCard title="Flagged" value={stats?.fake ?? "—"} hint="Awaiting admin review" tone="rose" />
      </div>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-white">Recent complaints</h2>
        <Link
          to="/app/complaints/new"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
        >
          New complaint
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c._id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link className="text-accent hover:underline" to={`/app/complaints/${c._id}`}>
                    {c.ticketId}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.title}</td>
                <td className="px-4 py-3 capitalize">{c.status?.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 capitalize">{c.category?.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={!canDelete(c.status) || deletingId === c._id}
                    onClick={() => deleteComplaint(c)}
                    className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900"
                  >
                    {deletingId === c._id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {complaints.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No complaints yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
