function SettingsAccountTab({
  currentPassword,
  onCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  loading,
  error,
  success,
  onSubmit,
}) {
  return (
    <form className="settings-form" onSubmit={onSubmit}>
      <h2>Account & Security</h2>
      <p className="settings-section-desc">
        Change the password you use to sign in to TaskForge.
      </p>

      {success && (
        <div className="settings-saved-banner">{success}</div>
      )}

      {error && (
        <div className="settings-error-banner">{error}</div>
      )}

      <label>
        Current Password
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => onCurrentPasswordChange(e.target.value)}
          placeholder="Enter current password"
          disabled={loading}
          autoComplete="current-password"
        />
      </label>

      <label>
        New Password
        <input
          type="password"
          value={newPassword}
          onChange={(e) => onNewPasswordChange(e.target.value)}
          placeholder="At least 6 characters"
          disabled={loading}
          autoComplete="new-password"
        />
      </label>

      <label>
        Confirm New Password
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          placeholder="Re-enter new password"
          disabled={loading}
          autoComplete="new-password"
        />
      </label>

      <div className="settings-form-actions">
        <button
          type="submit"
          className="settings-primary-btn"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </form>
  );
}

export default SettingsAccountTab;