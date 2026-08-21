import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Projects from "../pages/Projects";
import Settings from "../pages/Settings";
import DashboardLayout from "../layoutes/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import AuthLayout from "../components/auth/AuthLayout";
import authRoutes from "./auth/authRoutes";

function Router() {
  return (
    <Routes>
      <Route path="/" element={<h1>TaskForge</h1>} />

      <Route element={<AuthLayout />}>
        {authRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={route.element}
          />
        ))}
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default Router;