import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function VerifyEmail() {
  const { verificationToken } = useParams();

  const hasVerified = useRef(false);

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (hasVerified.current) {
      return;
    }

    hasVerified.current = true;

    const verifyEmail = async () => {
      try {
        const response = await api.get(
          `/auth/verify-email/${verificationToken}`
        );

        setStatus("success");
        setMessage(
          response.data.message || "Email verified successfully."
        );
      } catch (error) {
        setStatus("error");

        setMessage(
          error.response?.data?.message ||
            "Email verification failed. The link may be invalid or expired."
        );
      }
    };

    verifyEmail();
  }, [verificationToken]);

  if (status === "loading") {
    return (
      <div>
        <h1>Verifying Email...</h1>
        <p>Please wait while we verify your email.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div>
        <h1>Email Verified!</h1>
        <p>{message}</p>

        <Link to="/login">Go to Login</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Verification Failed</h1>
      <p>{message}</p>

      <Link to="/login">Go to Login</Link>
    </div>
  );
}

export default VerifyEmail;