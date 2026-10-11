import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";
import { connectSocket } from "../../services/socket.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function OfficerDashboard() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);

  const load = async () => {
    const { data } = await api.get("/complaints/officer");
    setRows(data.complaints || []);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const socket = connectSocket(token);
    if (!socket) return;
    const onUp = () => load();
    socket.on("complaint:updated", onUp);
    return () => {
      socket.off("complaint:updated", onUp);
      socket.disconnect();
    };
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold dark:text-white">Department queue</h1>
        <p className="text-sm text-slate-500">Complaints routed to your department</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Citizen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c._id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link className="text-accent hover:underline" to={`/officer/complaints/${c._id}`}>
                    {c.ticketId}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.title}</td>
                <td className="px-4 py-3 capitalize">{c.status?.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{c.createdBy?.name}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No complaints in your queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
