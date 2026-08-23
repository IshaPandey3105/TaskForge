import formatDate from "../../utils/formatDate";

function NoteCard({
  note,
  canManage,
  onOpenDetails,
  onEdit,
  onRequestDelete,
}) {
  return (
    <div
      className="note-card clickable"
      onClick={() => onOpenDetails(note)}
    >
      <p className="note-card-content">{note.content}</p>

      <div className="note-card-meta">
        <span className="note-card-project">
          {note.project?.name || "No project"}
        </span>
        <span className="note-card-creator">
          {note.createdBy?.fullName ||
            note.createdBy?.username ||
            "Unknown"}
        </span>
      </div>

      <div className="note-card-dates">
        <span>Created {formatDate(note.createdAt)}</span>
        {note.updatedAt && note.updatedAt !== note.createdAt && (
          <span>Updated {formatDate(note.updatedAt)}</span>
        )}
      </div>

      {canManage && (
        <div className="note-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="danger"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(note);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default NoteCard;