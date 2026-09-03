import { useRef, useState } from "react";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";

function SettingsProfileTab() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

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

  const handleAvatarSubmit = async (e) => {
    e.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError("Please choose an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const res = await api.patch("/users/avatar", formData);
      setUser(res.data.data);
      setUploadSuccess("Profile picture updated.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setUploadSuccess(""), 4000);
    } catch (err) {
      setUploadError(
        err.response?.data?.message || "Unable to update profile picture."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
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
          <span className="settings-profile-avatar-fallback">{initials}</span>
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

      {/* Profile picture upload */}
      <form className="settings-avatar-form" onSubmit={handleAvatarSubmit}>
        <div className="settings-avatar-controls">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="settings-avatar-input"
            aria-label="Choose a profile picture"
          />
          <button
            type="submit"
            className="settings-primary-btn"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Change Photo"}
          </button>
        </div>

        {uploadError && (
          <div className="settings-error-banner">{uploadError}</div>
        )}
        {uploadSuccess && (
          <div className="settings-saved-banner">{uploadSuccess}</div>
        )}
      </form>

      <div className="settings-note">
        Editing profile details (name, username, email) is not
        available yet — the backend does not currently provide a
        profile-update endpoint. Once one exists, this section can be
        connected to it.
      </div>
    </section>
  );
}

export default SettingsProfileTab;