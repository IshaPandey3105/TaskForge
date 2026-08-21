import { useState } from "react";
import useAuthStore from "../store/authStore";
import "./Settings.css";

function Settings() {
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState("profile");

  // Profile form state (pre-filled from existing user data)
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");

  // Appearance state
  const [theme, setTheme] = useState("dark");
  const [compactMode, setCompactMode] = useState(false);

  // Notifications state
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [taskNotifs, setTaskNotifs] = useState(true);
  const [mentionNotifs, setMentionNotifs] = useState(true);

  // Account state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "appearance", label: "Appearance" },
    { id: "notifications", label: "Notifications" },
    { id: "account", label: "Account & Security" },
  ];

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
          {saved && (
            <div className="settings-saved-banner">
              Changes saved successfully.
            </div>
          )}

          {activeTab === "profile" && (
            <form className="settings-form" onSubmit={handleSave}>
              <h2>Profile</h2>
              <p className="settings-section-desc">
                Your basic profile information shown across TaskForge.
              </p>

              <label>
                Full Name
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>

              <label>
                Username
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <div className="settings-role">
                <span className="settings-role-label">Global Role</span>
                <span className="settings-role-value">
                  {user?.role || "member"}
                </span>
              </div>

              <div className="settings-form-actions">
                <button type="submit" className="settings-primary-btn">
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === "appearance" && (
            <form className="settings-form" onSubmit={handleSave}>
              <h2>Appearance</h2>
              <p className="settings-section-desc">
                Customize how TaskForge looks for you.
              </p>

              <div className="settings-field">
                <span className="settings-field-label">Theme</span>
                <div className="settings-options">
                  <button
                    type="button"
                    className={theme === "dark" ? "active" : ""}
                    onClick={() => setTheme("dark")}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    className={theme === "light" ? "active" : ""}
                    onClick={() => setTheme("light")}
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
                    onChange={(e) => setCompactMode(e.target.checked)}
                  />
                  <span>Use a more compact layout</span>
                </label>
              </div>

              <div className="settings-form-actions">
                <button type="submit" className="settings-primary-btn">
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === "notifications" && (
            <form className="settings-form" onSubmit={handleSave}>
              <h2>Notifications</h2>
              <p className="settings-section-desc">
                Choose what you want to be notified about.
              </p>

              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                />
                <span>Email notifications</span>
              </label>

              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={taskNotifs}
                  onChange={(e) => setTaskNotifs(e.target.checked)}
                />
                <span>Task updates</span>
              </label>

              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={mentionNotifs}
                  onChange={(e) => setMentionNotifs(e.target.checked)}
                />
                <span>Mentions and comments</span>
              </label>

              <div className="settings-form-actions">
                <button type="submit" className="settings-primary-btn">
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === "account" && (
            <form className="settings-form" onSubmit={handlePasswordSubmit}>
              <h2>Account & Security</h2>
              <p className="settings-section-desc">
                Manage your password and account security.
              </p>

              <label>
                Current Password
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </label>

              <label>
                New Password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </label>

              <label>
                Confirm New Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </label>

              <div className="settings-form-actions">
                <button type="submit" className="settings-primary-btn">
                  Update Password
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