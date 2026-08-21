import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import "./DashboardLayout.css";

const mainNavItems = [
  { label: "Dashboard", path: "/dashboard", icon: "◈" },
  { label: "Projects", path: "/projects", icon: "▤" },
  { label: "Tasks", path: "/tasks", icon: "☑" },
  { label: "Notes", path: "/notes", icon: "✎" },
  { label: "Members", path: "/members", icon: "◉" },
  { label: "Activity", path: "/activity", icon: "⬡" },
];

const secondaryNavItems = [
  { label: "Settings", path: "/settings", icon: "⚙" },
];

function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } finally {
      setLoggingOut(false);
      setLogoutConfirmOpen(false);
    }
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Note: the dropdown closes automatically when clicking outside,
  // which covers nav item clicks since nav items are outside the ref.

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

  const currentPage =
    mainNavItems.find((item) => item.path === location.pathname)?.label ||
    "Dashboard";

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">TaskForge</div>

        <nav className="dashboard-nav">
          <p className="nav-section-label">Workspace</p>

          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "dashboard-nav-item active" : "dashboard-nav-item"
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dashboard-nav-bottom">
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "dashboard-nav-item active" : "dashboard-nav-item"
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <button
            type="button"
            className="dashboard-nav-item logout"
            onClick={() => setLogoutConfirmOpen(true)}
          >
            <span className="nav-icon">⏻</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <span className="topbar-title">{currentPage}</span>
          </div>

          <div className="topbar-profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="topbar-profile"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              {showAvatar ? (
                <img
                  className="profile-avatar"
                  src={avatarUrl}
                  alt={user?.fullName || "User"}
                />
              ) : (
                <span className="profile-avatar-fallback">{initials}</span>
              )}

              <div className="profile-info">
                <span className="profile-name">
                  {user?.fullName || "User"}
                </span>
                <span className="profile-role">
                  {user?.role || "member"}
                </span>
              </div>

              <span className="profile-caret">▾</span>
            </button>

            {profileOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-dropdown-header">
                  {showAvatar ? (
                    <img
                      className="profile-dropdown-avatar"
                      src={avatarUrl}
                      alt={user?.fullName || "User"}
                    />
                  ) : (
                    <span className="profile-dropdown-avatar-fallback">
                      {initials}
                    </span>
                  )}

                  <div className="profile-dropdown-identity">
                    <span className="profile-dropdown-name">
                      {user?.fullName || "User"}
                    </span>
                    <span className="profile-dropdown-email">
                      {user?.email || user?.username || ""}
                    </span>
                  </div>
                </div>

                <div className="profile-dropdown-role">
                  <span className="profile-dropdown-role-label">
                    Role
                  </span>
                  <span className="profile-dropdown-role-value">
                    {user?.role || "member"}
                  </span>
                </div>

                <div className="profile-dropdown-divider" />

                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => navigate("/settings")}
                >
                  <span className="profile-dropdown-icon">⚙</span>
                  Settings
                </button>

                <button
                  type="button"
                  className="profile-dropdown-item danger"
                  onClick={() => {
                    setProfileOpen(false);
                    setLogoutConfirmOpen(true);
                  }}
                >
                  <span className="profile-dropdown-icon">⏻</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>

        <footer className="dashboard-footer">
          <span>© {new Date().getFullYear()} TaskForge</span>
          <span className="dashboard-footer-sep">·</span>
          <span>Project Management Workspace</span>
        </footer>
      </div>

      {/* Logout confirmation modal */}
      {logoutConfirmOpen && (
        <div
          className="modal-overlay"
          onClick={() => !loggingOut && setLogoutConfirmOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Log out of TaskForge?</h3>
            <p className="modal-text">
              You will need to sign in again to access your workspace.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                disabled={loggingOut}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-danger"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;