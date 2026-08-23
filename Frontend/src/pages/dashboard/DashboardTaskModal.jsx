import { STATUS_LABELS, STATUS_ORDER } from "../../utils/taskStatus";

function DashboardTaskModal({
  modal,
  form,
  onFormChange,
  error,
  saving,
  onClose,
  onSubmit,
}) {
  if (!modal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{modal.mode === "create" ? "New Task" : "Edit Task"}</h3>

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
                onFormChange({
                  ...form,
                  description: e.target.value,
                })
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

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : modal.mode === "create"
                  ? "Create Task"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DashboardTaskModal;