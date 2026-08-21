const THEME_KEY = "taskforge-theme";
const COMPACT_KEY = "taskforge-compact";

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function getStoredCompact() {
  try {
    return localStorage.getItem(COMPACT_KEY) === "true";
  } catch {
    return false;
  }
}

// Applies the theme to <html> so all dashboard CSS can react to it,
// and persists the choice so it survives refreshes.
export function applyTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage unavailable — still apply for this session
  }

  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function applyCompact(enabled) {
  try {
    localStorage.setItem(COMPACT_KEY, enabled ? "true" : "false");
  } catch {
    // localStorage unavailable — still apply for this session
  }

  if (enabled) {
    document.documentElement.setAttribute("data-compact", "true");
  } else {
    document.documentElement.removeAttribute("data-compact");
  }
}

// Restores previously saved preferences on app start.
export function initStoredPreferences() {
  applyTheme(getStoredTheme());
  applyCompact(getStoredCompact());
}