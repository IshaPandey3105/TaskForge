import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setSuccess(
        response.data.message ||
          "Password reset email has been sent."
      );

      setEmail("");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to send password reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>

      <p>
        Enter your registered email address and we will send you
        a password reset link.
      </p>

      {error && <p className="auth-error">{error}</p>}

      {success && <p>{success}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p>
        Remember your password?{" "}
        <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default ForgotPassword;