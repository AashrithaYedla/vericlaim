import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Login from "./pages/Login.jsx";
import RegisterUser from "./pages/RegisterUser.jsx";
import RegisterAdmin from "./pages/RegisterAdmin.jsx";
import RegisterDepartmentAdmin from "./pages/RegisterDepartmentAdmin.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import { CitizenLayout, AdminLayout, OfficerLayout } from "./components/RoleLayouts.jsx";
import CitizenDashboard from "./pages/citizen/CitizenDashboard.jsx";
import NewComplaint from "./pages/citizen/NewComplaint.jsx";
import ComplaintDetail from "./pages/ComplaintDetail.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminComplaintList from "./pages/admin/AdminComplaintList.jsx";
import OfficerDashboard from "./pages/officer/OfficerDashboard.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/register-user" element={<RegisterUser />} />
      <Route path="/register-admin" element={<RegisterAdmin />} />
      <Route path="/register-department-admin" element={<RegisterDepartmentAdmin />} />

      <Route element={<CitizenLayout />}>
        <Route path="/app" element={<CitizenDashboard />} />
        <Route path="/app/complaints/new" element={<NewComplaint />} />
        <Route path="/app/complaints/:id" element={<ComplaintDetail basePath="/app" />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/complaints" element={<AdminComplaintList />} />
        <Route path="/admin/complaints/:id" element={<ComplaintDetail basePath="/admin" />} />
      </Route>

      <Route element={<OfficerLayout />}>
        <Route path="/officer" element={<OfficerDashboard />} />
        <Route path="/officer/complaints/:id" element={<ComplaintDetail basePath="/officer" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
