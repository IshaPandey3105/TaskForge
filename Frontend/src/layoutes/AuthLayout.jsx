import { Outlet } from "react-router-dom";
import "./AuthLayout.css";

function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-brand">
        TaskForge
      </div>

      <main className="auth-card">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthLayout;