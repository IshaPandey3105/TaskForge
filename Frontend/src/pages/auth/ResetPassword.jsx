import {useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import api from "../../services/api";

function ResetPassword() {
  const {resetToken} = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(`/auth/reset-password/${resetToken}`, {
        newPassword,
      });

      setSuccess(response.data.message || "Password reset successfully.");

      setNewPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to reset password. The link may be invalid or expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Reset Password</h1>

      <p>Enter your new password below.</p>

      {error && <p className="auth-error">{error}</p>}

      {success && <p>{success}</p>}

      {!success && (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="newPassword">New Password</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "⚪" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      {success && (
        <p>
          <Link to="/login">Go to Login</Link>
        </p>
      )}
    </div>
  );
}

export default ResetPassword;
