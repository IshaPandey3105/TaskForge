function ProjectDeleteModal({
  modal,
  error,
  saving,
  onClose,
  onDelete,
}) {
  if (!modal || modal.mode !== "delete") return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Delete Project?</h3>
        <p className="modal-text">
          This will permanently delete "{modal.project.name}" and all its
          memberships. This action cannot be undone.
        </p>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-danger"
            onClick={onDelete}
            disabled={saving}
          >
            {saving ? "Deleting..." : "Delete Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectDeleteModal;