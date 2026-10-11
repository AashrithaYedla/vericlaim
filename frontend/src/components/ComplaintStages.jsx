const STAGES = [
  { key: 1, label: "Submitted" },
  { key: 2, label: "AI verification" },
  { key: 3, label: "Department" },
  { key: 4, label: "In progress" },
  { key: 5, label: "Resolved" },
  { key: 6, label: "Closed" },
];

function stageFromStatus(status) {
  const m = {
    submitted: 1,
    ai_verification: 2,
    assigned: 3,
    in_progress: 4,
    resolved: 5,
    closed: 6,
    suspicious: 0,
    rejected_fake: 0,
  };
  return m[status] ?? 1;
}

export default function ComplaintStages({ status }) {
  const current = stageFromStatus(status);
  const isBad = status === "suspicious" || status === "rejected_fake";

  if (isBad) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/40">
        <p className="font-medium text-rose-800 dark:text-rose-200">Flagged for review</p>
        <p className="mt-1 text-sm text-rose-700/90 dark:text-rose-300/90">
          This complaint did not pass automated verification. An administrator will review it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-1 overflow-x-auto pb-2">
        {STAGES.map((s) => {
          const done = current >= s.key;
          return (
            <div key={s.key} className="flex min-w-[72px] flex-1 flex-col items-center text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-accent text-white"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {s.key}
              </div>
              <span className="mt-1 text-[10px] font-medium text-slate-600 dark:text-slate-400 sm:text-xs">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-teal-300 transition-all duration-500"
          style={{ width: `${Math.min(100, (current / 6) * 100)}%` }}
        />
      </div>
    </div>
  );
}
