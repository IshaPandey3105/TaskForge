import { STATUS_LABELS, STATUS_ORDER } from "../../utils/taskStatus";

function ProjectTaskModal({
  open,
  form,
  onFormChange,
  error,
  saving,
  members,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>New Task</h3>

        {error && <p className="modal-error">{error}</p>}

        <form onSubmit={onSubmit}>
          <label>
            Title
            <input
              type="text"
              value={form.title}
              onChange={(e) => onFormChange({ ...form, title: e.target.value })}
              placeholder="Task title"
            />
          </label>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                onFormChange({ ...form, description: e.target.value })
              }
              placeholder="Task description"
              rows="3"
            />
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(e) =>
                onFormChange({ ...form, status: e.target.value })
              }
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label>
            Assignee
            <select
              value={form.assignedTo}
              onChange={(e) =>
                onFormChange({ ...form, assignedTo: e.target.value })
              }
            >
              <option value="">Select assignee...</option>
              {members.map((m) => (
                <option key={m.user?._id} value={m.user?._id}>
                  {m.user?.fullName || m.user?.username}
                </option>
              ))}
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectTaskModal;