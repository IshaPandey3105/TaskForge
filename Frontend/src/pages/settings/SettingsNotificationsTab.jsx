function SettingsNotificationsTab({
  emailNotifs,
  onEmailNotifsChange,
  taskNotifs,
  onTaskNotifsChange,
  mentionNotifs,
  onMentionNotifsChange,
}) {
  return (
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
          onChange={onEmailNotifsChange}
        />
        <span>Email notifications</span>
      </label>

      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={taskNotifs}
          onChange={onTaskNotifsChange}
        />
        <span>Task updates</span>
      </label>

      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={mentionNotifs}
          onChange={onMentionNotifsChange}
        />
        <span>Mentions and comments</span>
      </label>
    </section>
  );
}

export default SettingsNotificationsTab;