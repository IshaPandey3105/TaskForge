import {useState} from "react";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import {useNavigate, Link} from "react-router-dom";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Client-side validation
    if (!identifier.trim()) {
      setError("Please enter your username or email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const isEmail = identifier.includes("@");

      const loginData = isEmail
        ? {
            email: identifier.trim(),
            password,
          }
        : {
            username: identifier.trim(),
            password,
          };

      const response = await api.post("/auth/login", loginData);

      const user = response.data.data.user;

      login(user);
      navigate("/dashboard");

      console.log("Login successful:", user);
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to login. Please try again.";

      setError(message);

      // If email is not verified,
      // redirect user to the resend verification page.
      if (message === "Please verify your email before logging in") {
        navigate("/resend-email-verification");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Login</h1>

      {error && <p className="auth-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="identifier">Username or Email</label>

          <input
            id="identifier"
            type="text"
            placeholder="Enter username or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>

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
            >
              {showPassword ? "⚪" : "👁️"}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="auth-footer-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <p className="auth-footer-link">
          Forgot your password? <Link to="/forgot-password">Reset it</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
