import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
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
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default Router;