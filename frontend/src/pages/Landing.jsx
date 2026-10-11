import { Link } from "react-router-dom";

const features = [
  { title: "AI categorization", desc: "Images and text are analyzed to route issues to the right department." },
  { title: "Fraud signals", desc: "Heuristics flag spam, repetitive, and suspicious submissions for review." },
  { title: "Live tracking", desc: "Citizens follow every stage from submission to resolution." },
  { title: "Secure roles", desc: "Citizens, admins, and department officers each see only what they need." },
];
const supportContacts = [
  { dept: "Water Department", email: "water@vericlaim.gov", phone: "1800-100-1002" },
  { dept: "Electricity Department", email: "electricity@vericlaim.gov", phone: "1800-100-1003" },
  { dept: "Roads & Drainage", email: "roads@vericlaim.gov", phone: "1800-100-1004" },
  { dept: "Sanitation", email: "sanitation@vericlaim.gov", phone: "1800-100-1001" },
];

export default function Landing() {
  return (
    <div className="gradient-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 lg:px-8">
        <span className="font-display text-xl font-bold text-accent">VeriClaim</span>
        <nav className="flex gap-4 text-sm font-medium text-white/80">
          <a href="#features" className="hover:text-primary">
            Features
          </a>
          <a href="#ai" className="hover:text-primary">
            AI
          </a>
          <Link to="/about" className="hover:text-primary">
            About
          </Link>
          <Link to="/contact" className="hover:text-primary">
            Contact
          </Link>
          <Link to="/login" className="rounded-full bg-accent px-4 py-1.5 text-primary hover:bg-accent-hover">
            Login
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div className="animate-[fadeIn_0.8s_ease-out]">
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Civic technology
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-slate-900 dark:text-white sm:text-5xl">
            Smart complaint management for modern cities
          </h1>
          <p className="mt-6 text-lg text-white/80">
            VeriClaim helps residents report issues with evidence, routes work automatically, and gives teams a
            single place to resolve cases—backed by transparent AI checks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register-user"
              className="rounded-full bg-accent px-6 py-3 font-semibold text-primary shadow-lg shadow-black/30 hover:bg-accent-hover"
            >
              Register as User
            </Link>
            <Link
              to="/register-admin"
              className="rounded-full border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur hover:bg-white/15"
            >
              Register as Admin
            </Link>
            <a
              href="#stats"
              className="rounded-full border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur hover:bg-white/15"
            >
              See impact
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-accent/20 to-white/10 blur-2xl" />
          <div className="glass relative rounded-3xl p-6 shadow-2xl">
            <p className="text-sm font-semibold text-accent">Live pipeline</p>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Submitted → AI verification → Department routing
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Officers update progress with proof images
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Residents track resolution in real time
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <h2 className="font-display text-3xl font-bold text-white">Built for trust</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-white/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="ai" className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <div className="glass rounded-3xl px-8 py-12 text-white">
          <h2 className="font-display text-2xl font-bold">How AI verification works</h2>
          <p className="mt-4 max-w-3xl text-white/80">
            Each complaint is scored using text signals, optional image metadata, optional Python microservice
            enrichment, and rate limits for spam. High-risk items are held for admin review instead of being routed.
          </p>
        </div>
      </section>

      <section id="stats" className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { k: "24/7", l: "Submission window" },
            { k: "6+", l: "Lifecycle stages" },
            { k: "100%", l: "Audit trail on every ticket" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-display text-4xl font-bold text-accent">{s.k}</p>
              <p className="mt-1 text-sm text-white/70">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-white">Official Customer Support</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="glass rounded-2xl p-6 text-white/85">
            <p><span className="font-semibold text-accent">Official Email:</span> support@vericlaim.gov</p>
            <p className="mt-2"><span className="font-semibold text-accent">Customer Care:</span> +91 1800-999-2026</p>
            <p className="mt-2"><span className="font-semibold text-accent">Emergency Contact:</span> 112</p>
            <p className="mt-2"><span className="font-semibold text-accent">Working Hours:</span> Mon-Sat 09:00-18:00</p>
            <p className="mt-2"><span className="font-semibold text-accent">Office Address:</span> Municipality Civic Center, Main City</p>
          </div>
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white">Department Directory</h3>
            <div className="mt-3 space-y-2 text-sm text-white/80">
              {supportContacts.map((c) => (
                <p key={c.dept}>
                  <span className="font-medium text-accent">{c.dept}:</span> {c.email} · {c.phone}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-white">FAQ</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="glass rounded-2xl p-5 text-white/80">
            <p className="font-semibold text-white">How do fake complaints get blocked?</p>
            <p className="mt-2 text-sm">Image and text are scored with AI + fraud heuristics before complaint creation.</p>
          </div>
          <div className="glass rounded-2xl p-5 text-white/80">
            <p className="font-semibold text-white">Can rejected complaints be restored?</p>
            <p className="mt-2 text-sm">Yes. Admins can manually approve rejected AI logs from the override queue.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-white">What residents say</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {["“Clear status updates every step.”", "“Uploading a photo made the issue obvious.”", "“Feels official but easy.”"].map(
            (q, i) => (
              <blockquote
                key={i}
                className="glass rounded-2xl p-6 text-sm italic text-white/80"
              >
                {q}
              </blockquote>
            )
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-white/70 md:flex-row lg:px-8">
          <span>© {new Date().getFullYear()} VeriClaim</span>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-accent">
              Login
            </Link>
            <Link to="/register-user" className="hover:text-accent">
              User Register
            </Link>
            <Link to="/register-admin" className="hover:text-accent">
              Admin Register
            </Link>
          </div>
        </div>
      </footer>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
