function DashboardNoteModal({
  modal,
  content,
  onContentChange,
  error,
  saving,
  onClose,
  onSubmit,
}) {
  if (!modal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{modal.mode === "create" ? "New Note" : "Edit Note"}</h3>

        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={onSubmit}>
          <label>
            Content
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Write a note..."
              rows="4"
            />
          </label>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : modal.mode === "create"
                  ? "Create Note"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DashboardNoteModal;