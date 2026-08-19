import Login from "../../pages/auth/Login";
import Register from "../../pages/auth/Register";
import VerifyEmail from "../../pages/auth/VerifyEmail";
import ForgotPassword from "../../pages/auth/ForgotPassword";
import ResetPassword from "../../pages/auth/ResetPassword";
import ResendEmailVerification from "../../pages/auth/ResendEmailVerification";

const authRoutes = [
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/verify-email/:verificationToken",
    element: <VerifyEmail />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password/:resetToken",
    element: <ResetPassword />,
  },
  {
    path: "/resend-email-verification",
    element: <ResendEmailVerification />,
  },
];

export default authRoutes;