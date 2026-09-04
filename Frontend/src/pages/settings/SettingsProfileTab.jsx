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
  const [deleting, setDeleting] = useState(false);

  // Profile editing state
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    username: "",
    email: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

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

  const startEditing = () => {
    setProfileForm({
      fullName: user?.fullName || "",
      username: user?.username || "",
      email: user?.email || "",
    });
    setEditing(true);
    setProfileError("");
    setProfileSuccess("");
  };

  const cancelEditing = () => {
    setEditing(false);
    setProfileError("");
    setProfileSuccess("");
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    if (!profileForm.fullName.trim() || !profileForm.username.trim() || !profileForm.email.trim()) {
      setProfileError("Full name, username, and email are required.");
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(profileForm.email.trim())) {
      setProfileError("Please enter a valid email address.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const res = await api.patch("/users/profile", {
        fullName: profileForm.fullName.trim(),
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
      });
      setUser(res.data.data);
      setProfileSuccess("Profile updated successfully.");
      setEditing(false);
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err) {
      setProfileError(
        err.response?.data?.message || "Unable to update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarSubmit = async () => {
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

  const handleDeleteAvatar = async () => {
    if (!window.confirm("Delete your profile picture? Your avatar will revert to the default.")) {
      return;
    }

    setDeleting(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const res = await api.delete("/users/avatar");
      setUser(res.data.data);
      setUploadSuccess("Profile picture deleted.");
      setTimeout(() => setUploadSuccess(""), 4000);
    } catch (err) {
      setUploadError(
        err.response?.data?.message || "Unable to delete profile picture."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="settings-profile-tab">
      <div className="profile-picture-section">
        <h4>Profile Picture</h4>
        <div className="profile-picture-row">
          <div className="profile-picture-preview">
            {showAvatar ? (
              <img
                className="profile-picture-img"
                src={avatarUrl}
                alt={user?.fullName || "User"}
              />
            ) : (
              <span className="profile-picture-fallback">{initials}</span>
            )}
          </div>

          <div className="profile-picture-controls">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarSubmit}
            />
            <button
              type="button"
              className="change-picture-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Change Picture"}
            </button>
            {showAvatar && (
              <button
                type="button"
                className="delete-picture-btn"
                onClick={handleDeleteAvatar}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Picture"}
              </button>
            )}
          </div>
        </div>

        {uploadError && <p className="modal-error">{uploadError}</p>}
        {uploadSuccess && <p className="modal-success">{uploadSuccess}</p>}
      </div>

      <div className="profile-details-section">
        <div className="profile-details-header">
          <h4>Profile Details</h4>
          {!editing && (
            <button
              type="button"
              className="edit-profile-btn"
              onClick={startEditing}
            >
              Edit
            </button>
          )}
        </div>

        {profileError && <p className="modal-error">{profileError}</p>}
        {profileSuccess && <p className="modal-success">{profileSuccess}</p>}

        {editing ? (
          <form className="profile-edit-form" onSubmit={handleProfileSave}>
            <label>
              Full Name
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, fullName: e.target.value })
                }
                placeholder="Your full name"
              />
            </label>

            <label>
              Username
              <input
                type="text"
                value={profileForm.username}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, username: e.target.value })
                }
                placeholder="Your username"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, email: e.target.value })
                }
                placeholder="your@email.com"
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={profileSaving}
              >
                Cancel
              </button>
              <button type="submit" disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details-view">
            <div className="profile-detail-row">
              <span className="profile-detail-label">Full Name</span>
              <span className="profile-detail-value">
                {user?.fullName || "—"}
              </span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Username</span>
              <span className="profile-detail-value">
                @{user?.username || "—"}
              </span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Email</span>
              <span className="profile-detail-value">
                {user?.email || "—"}
              </span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Role</span>
              <span className="profile-detail-value">
                {user?.role || "member"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsProfileTab;