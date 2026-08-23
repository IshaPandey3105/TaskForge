function TaskDeleteModal({ modal, deleting, error, onClose, onDelete }) {
  if (!modal) return null;

  return (
    <div className="modal-overlay" onClick={() => !deleting && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Delete Task?</h3>
        <p className="modal-text">
          This will permanently delete "{modal.task.title}". This
          action cannot be undone.
        </p>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-danger"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskDeleteModal;