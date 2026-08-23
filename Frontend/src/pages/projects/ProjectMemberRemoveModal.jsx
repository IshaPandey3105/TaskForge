function ProjectMemberRemoveModal({
  member,
  projectName,
  removing,
  onClose,
  onConfirm,
}) {
  if (!member) return null;

  return (
    <div className="modal-overlay" onClick={() => !removing && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Remove Member?</h3>
        <p className="modal-text">
          This will remove "{member.user?.fullName || member.user?.username}"
          (@{member.user?.username || "unknown"}) from "{projectName}". They
          will lose access to this project.
        </p>

        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={removing}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-danger"
            onClick={onConfirm}
            disabled={removing}
          >
            {removing ? "Removing..." : "Remove Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectMemberRemoveModal;