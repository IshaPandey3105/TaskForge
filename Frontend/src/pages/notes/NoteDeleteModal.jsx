function NoteDeleteModal({ modal, deleting, error, onClose, onDelete }) {
  if (!modal) return null;

  return (
    <div className="modal-overlay" onClick={() => !deleting && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Delete Note?</h3>
        <p className="modal-text">
          This will permanently delete this note from "
          {modal.note.project?.name}". This action cannot be undone.
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
            {deleting ? "Deleting..." : "Delete Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoteDeleteModal;