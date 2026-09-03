import { useState } from "react";
import api from "../../services/api";
import {
  getStoredTheme,
  getStoredCompact,
  applyTheme,
  applyCompact,
} from "../../utils/theme";
import "../../layoutes/Settings.css";

import SettingsProfileTab from "./SettingsProfileTab";
import SettingsAppearanceTab from "./SettingsAppearanceTab";
import SettingsNotificationsTab from "./SettingsNotificationsTab";
import SettingsAccountTab from "./SettingsAccountTab";

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

  return (
    <div className="settings-page">
      <div className="settings-header">
        <p className="page-tagline">
          Manage your preferences and account.
        </p>
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
          {activeTab === "profile" && <SettingsProfileTab />}

          {/* ---------- APPEARANCE (real, instant, persisted) ---------- */}
          {activeTab === "appearance" && (
            <SettingsAppearanceTab
              theme={theme}
              onThemeChange={handleThemeChange}
              compactMode={compactMode}
              onCompactChange={handleCompactChange}
            />
          )}

          {/* ---------- NOTIFICATIONS (local frontend preferences) ---------- */}
          {activeTab === "notifications" && (
            <SettingsNotificationsTab
              emailNotifs={emailNotifs}
              onEmailNotifsChange={updateNotif(NOTIF_KEYS.email, setEmailNotifs)}
              taskNotifs={taskNotifs}
              onTaskNotifsChange={updateNotif(NOTIF_KEYS.tasks, setTaskNotifs)}
              mentionNotifs={mentionNotifs}
              onMentionNotifsChange={updateNotif(
                NOTIF_KEYS.mentions,
                setMentionNotifs
              )}
            />
          )}

          {/* ---------- ACCOUNT & SECURITY (real backend endpoint) ---------- */}
          {activeTab === "account" && (
            <SettingsAccountTab
              currentPassword={currentPassword}
              onCurrentPasswordChange={setCurrentPassword}
              newPassword={newPassword}
              onNewPasswordChange={setNewPassword}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
              loading={passwordLoading}
              error={passwordError}
              success={passwordSuccess}
              onSubmit={handlePasswordSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;