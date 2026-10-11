import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const links = {
  citizen: [
    { to: "/app", label: "Overview", end: true },
    { to: "/app/complaints/new", label: "Raise complaint" },
  ],
  admin: [
    { to: "/admin", label: "Overview", end: true },
    { to: "/admin/complaints", label: "All complaints" },
  ],
  department_officer: [
    { to: "/officer", label: "My queue", end: true },
  ],
};

export default function DashboardShell({ variant }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = links[variant] || links.citizen;

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="glass hidden w-56 shrink-0 flex-col rounded-2xl p-4 shadow-sm md:flex">
          <div className="mb-6">
            <p className="font-display text-lg font-semibold text-accent">VeriClaim</p>
            <p className="text-xs text-white/70">{user?.name}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/50">{user?.role?.replace("_", " ")}</p>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-accent text-primary"
                      : "text-white/80 hover:bg-white/10"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={toggle}
              className="w-full rounded-lg border border-white/15 px-3 py-2 text-left text-xs text-white/80"
            >
              Theme: {theme}
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-full bg-accent px-3 py-2 text-xs font-semibold text-primary hover:bg-accent-hover"
            >
              Log out
            </button>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mb-4 md:hidden">
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold text-accent">VeriClaim</p>
              <button type="button" onClick={toggle} className="text-xs underline">
                {theme}
              </button>
            </div>
            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs">
              {nav.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-full px-3 py-1 ${
                      isActive ? "bg-accent text-primary" : "bg-white/10 text-white/80"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={logout}
                className="whitespace-nowrap rounded-full bg-accent px-3 py-1 text-primary hover:bg-accent-hover"
              >
                Log out
              </button>
            </nav>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
