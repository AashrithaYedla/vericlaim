export default function StatCard({ title, value, hint, tone = "slate" }) {
  const tones = {
    slate: "from-white/20 to-white/10",
    teal: "from-accent/70 to-white/10",
    amber: "from-amber-300/40 to-white/10",
    rose: "from-rose-300/40 to-white/10",
    emerald: "from-emerald-300/40 to-white/10",
  };
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br p-[1px] shadow-lg shadow-slate-900/10 dark:shadow-black/30 ${tones[tone] || tones.slate}`}
    >
      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-medium text-white/70">{title}</p>
        <p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p>
        {hint && <p className="mt-1 text-xs text-white/60">{hint}</p>}
      </div>
    </div>
  );
}
