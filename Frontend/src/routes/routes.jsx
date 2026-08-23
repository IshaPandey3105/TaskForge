import { Routes, Route } from "react-router-dom";

import DashboardLayout from "../layoutes/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import AuthLayout from "../components/auth/AuthLayout";

import authRoutes from "./auth/authRoutes";
import dashboardRoutes from "./dashboard/dashboardRoutes";
import projectRoutes from "./projects/projectRoutes";
import taskRoutes from "./tasks/taskRoutes";
import noteRoutes from "./notes/noteRoutes";
import memberRoutes from "./members/memberRoutes";
import activityRoutes from "./activity/activityRoutes";
import settingsRoutes from "./settings/settingsRoutes";

// All dashboard feature routes share the same layout + protection wrapper.
const dashboardFeatureRoutes = [
  ...dashboardRoutes,
  ...projectRoutes,
  ...taskRoutes,
  ...noteRoutes,
  ...memberRoutes,
  ...activityRoutes,
  ...settingsRoutes,
];

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
          {dashboardFeatureRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}
        </Route>
      </Route>
    </Routes>
  );
}

export default Router;