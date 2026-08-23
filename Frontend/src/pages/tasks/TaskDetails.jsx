import { STATUS_LABELS } from "../../utils/taskStatus";
import formatDate from "../../utils/formatDate";

function TaskDetails({ modal, canManage, onClose, onEdit }) {
  if (!modal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{modal.task.title}</h3>

        <div className="task-detail-grid">
          <div className="task-detail-row">
            <span className="task-detail-label">Status</span>
            <span className={`status-badge ${modal.task.status}`}>
              {STATUS_LABELS[modal.task.status] || modal.task.status}
            </span>
          </div>

          <div className="task-detail-row">
            <span className="task-detail-label">Project</span>
            <span className="task-detail-value">
              {modal.task.project?.name || "—"}
            </span>
          </div>

          <div className="task-detail-row">
            <span className="task-detail-label">Assignee</span>
            <span className="task-detail-value">
              {modal.task.assignedTo?.fullName ||
                modal.task.assignedTo?.username ||
                "Unassigned"}
            </span>
          </div>

          <div className="task-detail-row">
            <span className="task-detail-label">Created</span>
            <span className="task-detail-value">
              {formatDate(modal.task.createdAt) || "—"}
            </span>
          </div>

          <div className="task-detail-row">
            <span className="task-detail-label">Updated</span>
            <span className="task-detail-value">
              {formatDate(modal.task.updatedAt) || "—"}
            </span>
          </div>
        </div>

        {modal.task.description && (
          <div className="task-detail-desc">
            <span className="task-detail-label">Description</span>
            <p>{modal.task.description}</p>
          </div>
        )}

        <div className="task-detail-subtasks">
          <span className="task-detail-label">Subtasks</span>

          {modal.loading ? (
            <p className="task-detail-loading">Loading subtasks...</p>
          ) : modal.subtasks.length === 0 ? (
            <p className="task-detail-none">No subtasks.</p>
          ) : (
            <ul>
              {modal.subtasks.map((sub) => (
                <li key={sub._id}>
                  <span
                    className={`subtask-check ${
                      sub.isCompleted ? "done" : ""
                    }`}
                  >
                    {sub.isCompleted ? "✓" : ""}
                  </span>
                  <span
                    className={
                      sub.isCompleted ? "subtask-title done" : "subtask-title"
                    }
                  >
                    {sub.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
          {canManage && (
            <button
              type="button"
              className="modal-primary"
              onClick={() => onEdit(modal.task)}
            >
              Edit Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskDetails;