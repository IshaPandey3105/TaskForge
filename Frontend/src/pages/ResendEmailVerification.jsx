import {useState} from "react";
import {Link} from "react-router-dom";
import api from "../services/api";

function ResendEmailVerification() {
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
      const response = await api.post("/auth/resend-email-verification", {
        email: email.trim(),
      });

      setSuccess(response.data.message || "Verification email has been sent.");

      setEmail("");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to resend verification email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Verify Your Email</h1>

      {success ? (
        <div>
          <p>{success}</p>

          <p>Please check your email and click the verification link.</p>

          <Link to="/login">Go to Login</Link>
        </div>
      ) : (
        <>
          <p>
            Enter your registered email address and we will send you a new
            verification link.
          </p>

          {error && <p>{error}</p>}

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Resend Verification Email"}
            </button>
          </form>

          <p>
            <Link to="/login">Back to Login</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default ResendEmailVerification;
