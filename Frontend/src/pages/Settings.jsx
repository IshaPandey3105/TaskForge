import { useState } from "react";
import api from "../services/api";
import useAuthStore from "../store/authStore";
import {
  getStoredTheme,
  getStoredCompact,
  applyTheme,
  applyCompact,
} from "../utils/theme";
import "./Settings.css";

const NOTIF_KEYS = {
  email: "taskforge-notif-email",
  tasks: "taskforge-notif-tasks",
  mentions: "taskforge-notif-mentions",
};

function readNotifPref(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === "true";
  } catch {
    return fallback;
  }
}

function writeNotifPref(key, value) {
  try {
    localStorage.setItem(key, value ? "true" : "false");
  } catch {
    // localStorage unavailable — preference applies for this session only
  }
}

function Settings() {
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState("profile");

  // ---- Appearance (real, persisted, applied instantly) ----
  const [theme, setTheme] = useState(getStoredTheme());
  const [compactMode, setCompactMode] = useState(getStoredCompact());

  const handleThemeChange = (next) => {
    setTheme(next);
    applyTheme(next);
  };

  const handleCompactChange = (e) => {
    const enabled = e.target.checked;
    setCompactMode(enabled);
    applyCompact(enabled);
  };

  // ---- Notifications (frontend preferences, persisted locally) ----
  const [emailNotifs, setEmailNotifs] = useState(() =>
    readNotifPref(NOTIF_KEYS.email, true)
  );
  const [taskNotifs, setTaskNotifs] = useState(() =>
    readNotifPref(NOTIF_KEYS.tasks, true)
  );
  const [mentionNotifs, setMentionNotifs] = useState(() =>
    readNotifPref(NOTIF_KEYS.mentions, true)
  );

  const updateNotif = (key, setter) => (e) => {
    const value = e.target.checked;
    setter(value);
    writeNotifPref(key, value);
  };

  // ---- Change password (real backend endpoint) ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from the current one.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      await api.post("/auth/change-password", {
        oldPassword: currentPassword,
        newPassword,
      });

      setPasswordSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
          "Unable to change password. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "appearance", label: "Appearance" },
    { id: "notifications", label: "Notifications" },
    { id: "account", label: "Account & Security" },
  ];

  const avatarUrl = user?.avatar?.url;
  const showAvatar = avatarUrl && !avatarUrl.includes("placehold.co");

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "TF";

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your TaskForge account and preferences.</p>
      </div>

      <div className="settings-layout">
        <nav className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {/* ---------- PROFILE (read-only: no backend update endpoint) ---------- */}
          {activeTab === "profile" && (
            <section className="settings-form">
              <h2>Profile</h2>
              <p className="settings-section-desc">
                Your account information, as stored in TaskForge.
              </p>

              <div className="settings-profile-card">
                {showAvatar ? (
                  <img
                    className="settings-profile-avatar"
                    src={avatarUrl}
                    alt={user?.fullName || "User"}
                  />
                ) : (
                  <span className="settings-profile-avatar-fallback">
                    {initials}
                  </span>
                )}

                <div className="settings-profile-fields">
                  <div className="settings-field-row">
                    <span className="settings-field-label">Full Name</span>
                    <span className="settings-field-value">
                      {user?.fullName || "—"}
                    </span>
                  </div>

                  <div className="settings-field-row">
                    <span className="settings-field-label">Username</span>
                    <span className="settings-field-value">
                      {user?.username || "—"}
                    </span>
                  </div>

                  <div className="settings-field-row">
                    <span className="settings-field-label">Email</span>
                    <span className="settings-field-value">
                      {user?.email || "—"}
                    </span>
                  </div>

                  <div className="settings-field-row">
                    <span className="settings-field-label">Global Role</span>
                    <span className="settings-field-value settings-role-value">
                      {user?.role || "member"}
                    </span>
                  </div>

                  {user?.createdAt && (
                    <div className="settings-field-row">
                      <span className="settings-field-label">Member Since</span>
                      <span className="settings-field-value">
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="settings-note">
                Editing profile details (name, username, email) is not
                available yet — the backend does not currently provide a
                profile-update endpoint. Once one exists, this section can be
                connected to it.
              </div>
            </section>
          )}

          {/* ---------- APPEARANCE (real, instant, persisted) ---------- */}
          {activeTab === "appearance" && (
            <section className="settings-form">
              <h2>Appearance</h2>
              <p className="settings-section-desc">
                Changes apply immediately and are saved automatically.
              </p>

              <div className="settings-field">
                <span className="settings-field-label">Theme</span>
                <div className="settings-options">
                  <button
                    type="button"
                    className={theme === "dark" ? "active" : ""}
                    onClick={() => handleThemeChange("dark")}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    className={theme === "light" ? "active" : ""}
                    onClick={() => handleThemeChange("light")}
                  >
                    Light
                  </button>
                </div>
              </div>

              <div className="settings-field">
                <span className="settings-field-label">Compact Mode</span>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={handleCompactChange}
                  />
                  <span>Use a more compact layout with tighter spacing</span>
                </label>
              </div>
            </section>
          )}

          {/* ---------- NOTIFICATIONS (local frontend preferences) ---------- */}
          {activeTab === "notifications" && (
            <section className="settings-form">
              <h2>Notifications</h2>
              <p className="settings-section-desc">
                These preferences are stored locally in your browser and
                persist across refreshes.
              </p>

              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={updateNotif(NOTIF_KEYS.email, setEmailNotifs)}
                />
                <span>Email notifications</span>
              </label>

              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={taskNotifs}
                  onChange={updateNotif(NOTIF_KEYS.tasks, setTaskNotifs)}
                />
                <span>Task updates</span>
              </label>

              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={mentionNotifs}
                  onChange={updateNotif(NOTIF_KEYS.mentions, setMentionNotifs)}
                />
                <span>Mentions and comments</span>
              </label>
            </section>
          )}

          {/* ---------- ACCOUNT & SECURITY (real backend endpoint) ---------- */}
          {activeTab === "account" && (
            <form className="settings-form" onSubmit={handlePasswordSubmit}>
              <h2>Account & Security</h2>
              <p className="settings-section-desc">
                Change the password you use to sign in to TaskForge.
              </p>

              {passwordSuccess && (
                <div className="settings-saved-banner">{passwordSuccess}</div>
              )}

              {passwordError && (
                <div className="settings-error-banner">{passwordError}</div>
              )}

              <label>
                Current Password
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={passwordLoading}
                  autoComplete="current-password"
                />
              </label>

              <label>
                New Password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  disabled={passwordLoading}
                  autoComplete="new-password"
                />
              </label>

              <label>
                Confirm New Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  disabled={passwordLoading}
                  autoComplete="new-password"
                />
              </label>

              <div className="settings-form-actions">
                <button
                  type="submit"
                  className="settings-primary-btn"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;