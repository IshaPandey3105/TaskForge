import { useEffect, useState } from "react";
import api from "../../services/api";
import { STATUS_LABELS } from "../../utils/taskStatus";
import formatDate from "../../utils/formatDate";

// Task details modal with full subtask management.
//
// Project → Tasks → Subtasks: the related project is always shown, and
// subtasks support add / edit / delete (admins & project admins) plus
// complete/incomplete toggling for any project member — matching the
// existing backend permission rules exactly.

function TaskDetails({ modal, canManage, onClose, onEdit }) {
  const [subtasks, setSubtasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Sync local subtask state whenever a task is opened/reloaded
  useEffect(() => {
    if (modal) {
      setSubtasks(modal.subtasks || []);
      setNewTitle("");
      setEditingId(null);
      setError("");
    }
  }, [modal]);

  if (!modal) return null;

  const projectId = modal.task.project?._id;
  const taskId = modal.task._id;

  const runAction = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update subtask.");
    } finally {
      setBusy(false);
    }
  };

  // Any project member may toggle completion (backend allows all roles)
  const handleToggle = (sub) =>
    runAction(async () => {
      const res = await api.put(`/tasks/${projectId}/st/${sub._id}`, {
        isCompleted: !sub.isCompleted,
      });
      setSubtasks((list) =>
        list.map((s) => (s._id === sub._id ? { ...s, ...res.data.data } : s))
      );
    });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await runAction(async () => {
      const res = await api.post(
        `/tasks/${projectId}/t/${taskId}/subtasks`,
        { title: newTitle.trim() }
      );
      setSubtasks((list) => [...list, res.data.data]);
      setNewTitle("");
    });
  };

  const startEdit = (sub) => {
    setEditingId(sub._id);
    setEditingTitle(sub.title);
    setError("");
  };

  const handleRename = (sub) => {
    if (!editingTitle.trim()) return;

    runAction(async () => {
      const res = await api.put(`/tasks/${projectId}/st/${sub._id}`, {
        title: editingTitle.trim(),
      });
      setSubtasks((list) =>
        list.map((s) => (s._id === sub._id ? { ...s, ...res.data.data } : s))
      );
      setEditingId(null);
    });
  };

  const handleDelete = (sub) =>
    runAction(async () => {
      await api.delete(`/tasks/${projectId}/st/${sub._id}`);
      setSubtasks((list) => list.filter((s) => s._id !== sub._id));
    });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{modal.task.title}</h3>

        {/* Related project is always visible on the details UI */}
        <div className="task-detail-project-row">
          <span className="project-chip">
            {modal.task.project?.name || "—"}
          </span>
        </div>

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
          <span className="task-detail-label">
            Subtasks{" "}
            {subtasks.length > 0 && (
              <span className="subtask-count">
                {subtasks.filter((s) => s.isCompleted).length}/
                {subtasks.length} done
              </span>
            )}
          </span>

          {modal.loading ? (
            <p className="task-detail-loading">Loading subtasks...</p>
          ) : subtasks.length === 0 ? (
            <p className="task-detail-none">
              {canManage
                ? "No subtasks yet. Add one below."
                : "No subtasks."}
            </p>
          ) : (
            <ul className="subtask-list">
              {subtasks.map((sub) => (
                <li
                  key={sub._id}
                  className={`subtask-item ${sub.isCompleted ? "done" : ""}`}
                >
                  <button
                    type="button"
                    className={`subtask-check ${sub.isCompleted ? "done" : ""}`}
                    disabled={busy}
                    onClick={() => handleToggle(sub)}
                    title={
                      sub.isCompleted
                        ? "Mark as incomplete"
                        : "Mark as complete"
                    }
                  >
                    {sub.isCompleted ? "✓" : ""}
                  </button>

                  {editingId === sub._id ? (
                    <input
                      type="text"
                      className="subtask-edit-input"
                      value={editingTitle}
                      autoFocus
                      disabled={busy}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRename(sub);
                        }
                        if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                    />
                  ) : (
                    <span
                      className={
                        sub.isCompleted ? "subtask-title done" : "subtask-title"
                      }
                    >
                      {sub.title}
                    </span>
                  )}

                  <div className="subtask-actions">
                    {editingId === sub._id ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleRename(sub)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : canManage ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => startEdit(sub)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger"
                          disabled={busy}
                          onClick={() => handleDelete(sub)}
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {canManage && !modal.loading && (
            <form className="subtask-add-form" onSubmit={handleAdd}>
              <input
                type="text"
                placeholder="Add a subtask..."
                value={newTitle}
                disabled={busy}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <button type="submit" disabled={busy || !newTitle.trim()}>
                Add
              </button>
            </form>
          )}
        </div>

        {error && <p className="modal-error">{error}</p>}

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