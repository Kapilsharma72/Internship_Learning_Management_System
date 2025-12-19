import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext, useMemo } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import AdminPanel from "./pages/AdminPanel";
import "./App.css";

// Small wrapper that makes sure only the right role can see a given route.
function ProtectedRoute({ children, allowed }) {
  const { token, role } = useContext(AuthContext);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Role is derived from JWT asynchronously in context; avoid premature redirects.
  if (!role) {
    return null;
  }

  if (allowed && !allowed.includes(role)) {
    // If user is logged in but not allowed here, send them to their own area.
    if (role === "student") return <Navigate to="/student" replace />;
    if (role === "mentor") return <Navigate to="/mentor" replace />;
    if (role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

function ShellLayout({ children }) {
  const { role, logout } = useContext(AuthContext);
  const location = useLocation();

  const sectionLabel = useMemo(() => {
    if (location.pathname.startsWith("/student")) return "Student dashboard";
    if (location.pathname.startsWith("/mentor")) return "Mentor workspace";
    if (location.pathname.startsWith("/admin")) return "Admin control center";
    return "Dashboard";
  }, [location.pathname]);

  const friendlyDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date());
  }, []);

  const avatarInitial = role ? role.charAt(0).toUpperCase() : "?";
  const isStudentView = location.pathname.startsWith("/student");
  const isMentorView = location.pathname.startsWith("/mentor");
  const isAdminView = location.pathname.startsWith("/admin");

  const subtitleText = useMemo(() => {
    if (isStudentView || isMentorView || isAdminView) return null;
    return "Structured learning with strict RBAC";
  }, [isStudentView, isMentorView, isAdminView]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <div>
            <h1 className="app-title">Internship LMS</h1>
            {subtitleText && (
              <p className="app-subtitle">{subtitleText}</p>
            )}
          </div>
          {!isStudentView && !isMentorView && !isAdminView && (
            <div className="app-meta">
              <span className="app-meta-section">{sectionLabel}</span>
              <span className="app-meta-dot" />
              <span className="app-meta-date">{friendlyDate}</span>
            </div>
          )}
        </div>

        <div className="app-header-right">
          {role && (
            <>
              <div className="user-pill">
                <div className="avatar-circle" aria-hidden>
                  {avatarInitial}
                </div>
                <div className="user-text">
                  <span className="user-label">Signed in as</span>
                  <span className="user-role">{role}</span>
                </div>
              </div>
              <button className="btn secondary" onClick={logout}>
                Sign out
              </button>
            </>
          )}
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute allowed={["student"]}>
            <ShellLayout>
              <StudentDashboard />
            </ShellLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/mentor"
        element={
          <ProtectedRoute allowed={["mentor"]}>
            <ShellLayout>
              <MentorDashboard />
            </ShellLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowed={["admin"]}>
            <ShellLayout>
              <AdminPanel />
            </ShellLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
