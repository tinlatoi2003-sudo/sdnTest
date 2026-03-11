import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/AdminUsersPage";
import ManagerReportsPage from "./pages/ManagerReportsPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
import AdminBuildingsPage from "./pages/AdminBuildingsPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import ManagerRequestsPage from "./pages/ManagerRequestsPage";
import Footer from './components/Footer';
import Header from './components/Header';



const ManagerDashboard = () => (
  <div style={{ minHeight: "100vh", background: "#f8f9fb", color: "#1a1a1a", padding: 40, fontFamily: "Inter,sans-serif" }}>
    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>📋 Manager Dashboard</h1>
    <p style={{ color: "#888", marginTop: 8, marginBottom: 24, fontSize: 14 }}>Chào mừng trở lại! Quản lý báo cáo và yêu cầu KTX.</p>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <a href="/manager/reports" style={{ background: "linear-gradient(135deg,#e8540a,#ff7c3a)", color: "#fff", padding: "12px 22px", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 16px rgba(232,84,10,.3)", display: "inline-block" }}>
        📄 Quản lý báo cáo
      </a>
      <a href="/manager/requests" style={{ background: "#fff", color: "#e8540a", border: "1.5px solid #e8540a", padding: "12px 22px", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 600, display: "inline-block" }}>
        📝 Yêu cầu sinh viên
      </a>
    </div>
  </div>
);



// ── Protected Route ──
function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<PrivateRoute roles={["admin"]}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute roles={["admin"]}><AdminUsersPage /></PrivateRoute>} />
        <Route path="/admin/reports" element={<PrivateRoute roles={["admin"]}><AdminReportsPage /></PrivateRoute>} />
        <Route path="/admin/notifications" element={<PrivateRoute roles={["admin"]}><AdminNotificationsPage /></PrivateRoute>} />
        <Route path="/admin/buildings" element={<PrivateRoute roles={["admin"]}><AdminBuildingsPage /></PrivateRoute>} />

        {/* Manager routes */}
        <Route path="/manager/dashboard" element={<PrivateRoute roles={["manager"]}><ManagerDashboard /></PrivateRoute>} />
        <Route path="/manager/reports" element={<PrivateRoute roles={["manager"]}><ManagerReportsPage /></PrivateRoute>} />
        <Route path="/manager/requests" element={<PrivateRoute roles={["manager", "admin"]}><ManagerRequestsPage /></PrivateRoute>} />

        {/* Student */}
        <Route path="/student/*" element={<PrivateRoute roles={["student"]}><StudentDashboard /></PrivateRoute>} />

        {/* Default */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
