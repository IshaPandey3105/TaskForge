import formatDate from "../../utils/formatDate";

function NoteDetails({ modal, canManage, onClose, onEdit }) {
  if (!modal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Note</h3>

        <div className="note-detail-content">
          <p>{modal.note.content}</p>
        </div>

        <div className="note-detail-grid">
          <div className="note-detail-row">
            <span className="note-detail-label">Project</span>
            <span className="note-detail-value">
              {modal.note.project?.name || "—"}
            </span>
          </div>

          <div className="note-detail-row">
            <span className="note-detail-label">Created By</span>
            <span className="note-detail-value">
              {modal.note.createdBy?.fullName ||
                modal.note.createdBy?.username ||
                "—"}
            </span>
          </div>

          <div className="note-detail-row">
            <span className="note-detail-label">Created</span>
            <span className="note-detail-value">
              {formatDate(modal.note.createdAt) || "—"}
            </span>
          </div>

          <div className="note-detail-row">
            <span className="note-detail-label">Updated</span>
            <span className="note-detail-value">
              {formatDate(modal.note.updatedAt) || "—"}
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
          {canManage && (
            <button
              type="button"
              className="modal-primary"
              onClick={() => onEdit(modal.note)}
            >
              Edit Note
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteDetails;