function NoteModal({
  modal,
  form,
  onFormChange,
  error,
  saving,
  onClose,
  onSubmit,
  projects,
}) {
  if (!modal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{modal.mode === "create" ? "New Note" : "Edit Note"}</h3>

        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={onSubmit}>
          {modal.mode === "create" && (
            <label>
              Project
              <select
                value={form.projectId}
                onChange={(e) =>
                  onFormChange({ ...form, projectId: e.target.value })
                }
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Content
            <textarea
              value={form.content}
              onChange={(e) =>
                onFormChange({ ...form, content: e.target.value })
              }
              placeholder="Write your note..."
              rows="6"
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

export default NoteModal;