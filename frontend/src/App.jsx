import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/AdminUsersPage";
import ManagerReportsPage from "./pages/ManagerReportsPage";
import ManagerRequestsPage from "./pages/ManagerRequestsPage";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";

// ── Helper: đọc user an toàn từ localStorage ──
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

// ── Helper: map role → dashboard ──
const DASHBOARD_MAP = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  student: "/student/dashboard",
};

// ── Protected Route ──
function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  // Chưa đăng nhập
  if (!token || !user) return <Navigate to="/login" replace />;

  // Đã đăng nhập nhưng sai role → về đúng dashboard của mình
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={DASHBOARD_MAP[user.role] || "/login"} replace />;
  }

  return children;
}

// ── Guest Route: đã login thì không vào /login nữa ──
function GuestRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (token && user) {
    return <Navigate to={DASHBOARD_MAP[user.role] || "/"} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute roles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute roles={["admin"]}>
              <AdminUsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <PrivateRoute roles={["admin"]}>
              <AdminReportsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <PrivateRoute roles={["admin"]}>
              <AdminNotificationsPage />
            </PrivateRoute>
          }
        />

        {/* Manager routes */}
        <Route
          path="/manager/dashboard"
          element={
            <PrivateRoute roles={["manager"]}>
              <ManagerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/reports"
          element={
            <PrivateRoute roles={["manager"]}>
              <ManagerReportsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/requests"
          element={
            <PrivateRoute roles={["manager"]}>
              <ManagerRequestsPage />
            </PrivateRoute>
          }
        />

        {/* Student routes */}
        <Route
          path="/student/*"
          element={
            <PrivateRoute roles={["student"]}>
              <StudentDashboard />
            </PrivateRoute>
          }
        />

        {/* Fallback: mọi route không khớp → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}