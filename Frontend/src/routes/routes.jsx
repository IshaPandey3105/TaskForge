import { Routes, Route } from "react-router-dom";

import Activity from "../pages/Activity";
import Dashboard from "../pages/Dashboard";
import Members from "../pages/Members";
import Notes from "../pages/Notes";
import Projects from "../pages/Projects";
import Settings from "../pages/Settings";
import Tasks from "../pages/Tasks";
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
          <Route path="/activity" element={<Activity />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default Router;