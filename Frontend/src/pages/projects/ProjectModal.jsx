function ProjectModal({
  modal,
  form,
  onFormChange,
  error,
  saving,
  onClose,
  onSubmit,
}) {
  if (!modal || modal.mode === "delete") return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{modal.mode === "create" ? "New Project" : "Edit Project"}</h3>

        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={onSubmit}>
          <label>
            Name
            <input
              type="text"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="Project name"
            />
          </label>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                onFormChange({ ...form, description: e.target.value })
              }
              placeholder="Project description"
              rows="3"
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
                  ? "Create Project"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectModal;