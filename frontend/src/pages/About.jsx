import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 dark:text-slate-100">
      <Link to="/" className="text-sm text-accent hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 font-display text-3xl font-bold">About VeriClaim</h1>
      <p className="mt-4 text-slate-600 dark:text-slate-300">
        VeriClaim is a reference implementation of an AI-assisted civic complaint platform. It demonstrates secure
        role separation, automated routing, transparency for residents, and operational dashboards for administrators and
        field teams.
      </p>
      <p className="mt-4 text-slate-600 dark:text-slate-300">
        The stack pairs a React dashboard with a Node.js API, MongoDB persistence, optional Python analysis, and
        Socket.IO for live notifications.
      </p>
    </div>
  );
}
