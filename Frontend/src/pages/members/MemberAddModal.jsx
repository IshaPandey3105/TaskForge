function MemberAddModal({
  open,
  form,
  onFormChange,
  error,
  adding,
  onClose,
  onSubmit,
  manageableProjects,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={() => !adding && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add Member</h3>

        <p className="modal-text">
          Add an existing registered user to one of your projects by their
          email address.
        </p>

        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={onSubmit}>
          <label>
            Project
            <select
              value={form.projectId}
              onChange={(e) =>
                onFormChange({ ...form, projectId: e.target.value })
              }
            >
              <option value="">Select project...</option>
              {manageableProjects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                onFormChange({ ...form, email: e.target.value })
              }
              placeholder="member@example.com"
            />
          </label>

          <label>
            Project Role
            <select
              value={form.role}
              onChange={(e) =>
                onFormChange({ ...form, role: e.target.value })
              }
            >
              <option value="member">Member</option>
              <option value="project-admin">Project Admin</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={adding}>
              Cancel
            </button>
            <button type="submit" disabled={adding}>
              {adding ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MemberAddModal;