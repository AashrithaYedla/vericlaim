import { useState } from "react";
import { Link } from "react-router-dom";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/" className="text-sm text-accent hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 font-display text-3xl font-bold text-white">Official Support</h1>
      <div className="mt-4 grid gap-3 text-sm text-white/80 md:grid-cols-2">
        <p><span className="text-accent font-semibold">Support Email:</span> support@vericlaim.gov</p>
        <p><span className="text-accent font-semibold">Customer Care:</span> +91 1800-999-2026</p>
        <p><span className="text-accent font-semibold">Office:</span> Municipality Civic Center, Main City</p>
        <p><span className="text-accent font-semibold">Working Hours:</span> Mon-Sat 09:00-18:00</p>
      </div>
      {sent ? (
        <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-emerald-800">
          Thanks — your message has been recorded locally for this demo.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="glass mt-8 space-y-4 rounded-2xl p-5">
          <input
            required
            name="name"
            className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-slate-900"
            placeholder="Name"
          />
          <input
            required
            type="email"
            name="email"
            className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-slate-900"
            placeholder="Email"
          />
          <textarea
            required
            name="message"
            rows={4}
            className="w-full rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-slate-900"
            placeholder="Message"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-accent py-3 font-semibold text-primary hover:bg-accent-hover"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
