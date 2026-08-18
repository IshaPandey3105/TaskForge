import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore";

function ProtectedRoute() {
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const isLoading = useAuthStore(
    (state) => state.isLoading
  );

  if (isLoading) {
    return <p>Checking authentication...</p>;
  }

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}

export default ProtectedRoute;