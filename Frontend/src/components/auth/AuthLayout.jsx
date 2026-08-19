import { Outlet } from "react-router-dom";
import "./AuthLayout.css";

function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-brand">
        TaskForge
      </div>

      <div className="auth-card">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;