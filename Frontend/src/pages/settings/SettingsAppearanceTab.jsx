function SettingsAppearanceTab({
  theme,
  onThemeChange,
  compactMode,
  onCompactChange,
}) {
  return (
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
            onClick={() => onThemeChange("dark")}
          >
            Dark
          </button>
          <button
            type="button"
            className={theme === "light" ? "active" : ""}
            onClick={() => onThemeChange("light")}
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
            onChange={onCompactChange}
          />
          <span>Use a more compact layout with tighter spacing</span>
        </label>
      </div>
    </section>
  );
}

export default SettingsAppearanceTab;