// Logout confirmation dialog extracted from DashboardLayout so the
// logout feature lives in its own folder. Behavior is unchanged.

function LogoutConfirmModal({ open, loggingOut, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={() => !loggingOut && onCancel()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Log out of TaskForge?</h3>
        <p className="modal-text">
          You will need to sign in again to access your workspace.
        </p>

        <div className="modal-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={loggingOut}
          >
            Cancel
          </button>
          <button
            type="button"
            className="modal-danger"
            onClick={onConfirm}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutConfirmModal;