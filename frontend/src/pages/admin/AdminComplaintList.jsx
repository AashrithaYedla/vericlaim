import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";

export default function AdminComplaintList() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState({ status: "", fake: false });

  const load = async () => {
    const params = {};
    if (filter.fake) params.fake = "1";
    else if (filter.status) params.status = filter.status;
    const { data } = await api.get("/complaints/all", { params });
    setList(data.complaints || []);
  };

  useEffect(() => {
    load();
  }, [filter.status, filter.fake]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs text-slate-500">Status</label>
          <select
            value={filter.fake ? "" : filter.status}
            disabled={filter.fake}
            onChange={(e) => setFilter({ status: e.target.value, fake: false })}
            className="mt-1 block rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">All</option>
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
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={filter.fake}
            onChange={(e) => setFilter({ status: "", fake: e.target.checked })}
          />
          Fake / suspicious only
        </label>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Department</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c._id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link className="text-accent hover:underline" to={`/admin/complaints/${c._id}`}>
                    {c.ticketId}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.title}</td>
                <td className="px-4 py-3 capitalize">{c.status?.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{c.department?.name || c.departmentName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
