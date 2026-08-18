import {Routes, Route} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResendEmailVerification from "./pages/ResendEmailVerification";

function Router() {
  return (
    <Routes>
      <Route path="/" element={<h1>TaskForge</h1>} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
      <Route
        path="/resend-email-verification"
        element={<ResendEmailVerification />}
      />
      <Route path="/register" element={<Register />} />
      <Route
        path="/verify-email/:verificationToken"
        element={<VerifyEmail />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default Router;
