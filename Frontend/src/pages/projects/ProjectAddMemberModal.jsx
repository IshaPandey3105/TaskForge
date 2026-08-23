// Add-member modal scoped to a single project. Only "member" and
// "project-admin" are offered — "Admin" is not a project-level role.

function ProjectAddMemberModal({
  open,
  projectName,
  form,
  onFormChange,
  error,
  adding,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add Member</h3>

        <p className="modal-text">
          Add an existing registered user to "{projectName}" by their email
          address.
        </p>

        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={onSubmit}>
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

export default ProjectAddMemberModal;