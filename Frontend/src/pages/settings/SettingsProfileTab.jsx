function SettingsProfileTab({ user }) {
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
  );
}

export default SettingsProfileTab;