import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
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
        </Route>
      </Route>
    </Routes>
  );
}

export default Router;