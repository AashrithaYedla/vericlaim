import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardShell from "./DashboardShell.jsx";

function Gate({ roles, variant }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 dark:bg-slate-950">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <DashboardShell variant={variant} />;
}

/** DashboardShell originally used Outlet from react-router; extend to accept optional children for flexibility */
export function CitizenLayout() {
  return <Gate roles={["citizen"]} variant="citizen" />;
}

export function AdminLayout() {
  return <Gate roles={["admin"]} variant="admin" />;
}

export function OfficerLayout() {
  return <Gate roles={["department_officer"]} variant="department_officer" />;
}
