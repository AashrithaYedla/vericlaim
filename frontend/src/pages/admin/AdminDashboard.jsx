import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../../services/api.js";
import StatCard from "../../components/StatCard.jsx";

const COLORS = ["#0d9488", "#0f3d5c", "#f59e0b", "#ec4899", "#6366f1", "#14b8a6"];

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: d } = await api.get("/analytics/admin");
      setData(d);
    })();
  }, []);

  if (!data) return <p className="text-slate-500">Loading analytics…</p>;

  const statusRows = Object.entries(data.byStatus || {}).map(([name, count]) => ({ name, count }));
  const deptRows = (data.departmentWise || []).map((d) => ({ name: d.name, count: d.count }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold dark:text-white">Admin overview</h1>
        <p className="text-sm text-slate-500">City-wide complaint intelligence</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total complaints" value={data.total} tone="teal" />
        <StatCard title="Flagged / fake queue" value={data.fakeCount} tone="rose" />
        <StatCard title="Resolved + closed" value={data.resolvedCount} tone="emerald" />
        <StatCard title="Resolution rate" value={`${data.resolutionRate}%`} hint="Of all tickets" tone="slate" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold dark:text-white">By status</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusRows}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold dark:text-white">By department</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="count" data={deptRows} nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {deptRows.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
