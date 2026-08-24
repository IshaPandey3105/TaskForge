import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

// Reusable subtask manager for Project -> Task -> Subtasks.
// Self-fetches subtasks via GET /tasks/:projectId/t/:taskId and supports
// add / edit / delete (admins & project admins) plus complete/incomplete
// toggling for any project member — matching backend permission rules.

function TaskSubtasks({ projectId, taskId, canManage }) {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadSubtasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${projectId}/t/${taskId}`);
      setSubtasks(res.data.data?.subtasks || []);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId]);

  useEffect(() => {
    if (!projectId || !taskId) return;
    setNewTitle("");
    setEditingId(null);
    setError("");
    loadSubtasks();
  }, [projectId, taskId, loadSubtasks]);

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

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await runAction(async () => {
      const res = await api.post(`/tasks/${projectId}/t/${taskId}/subtasks`, {
        title: newTitle.trim(),
      });
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

  const doneCount = subtasks.filter((s) => s.isCompleted).length;

  return (
    <div className="task-detail-subtasks">
      <span className="task-detail-label">
        Subtasks{" "}
        {subtasks.length > 0 && (
          <span className="subtask-count">
            {doneCount}/{subtasks.length} done
          </span>
        )}
      </span>

      {loading ? (
        <p className="task-detail-loading">Loading subtasks...</p>
      ) : subtasks.length === 0 ? (
        <p className="task-detail-none">
          {canManage ? "No subtasks yet. Add one below." : "No subtasks."}
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
                  sub.isCompleted ? "Mark as incomplete" : "Mark as complete"
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
                    <button type="button" disabled={busy} onClick={() => handleRename(sub)}>Save</button>
                    <button type="button" disabled={busy} onClick={() => setEditingId(null)}>Cancel</button>
                  </>
                ) : canManage ? (
                  <>
                    <button type="button" disabled={busy} onClick={() => startEdit(sub)}>Edit</button>
                    <button type="button" className="danger" disabled={busy} onClick={() => handleDelete(sub)}>Delete</button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManage && !loading && (
        <div className="subtask-add-form">
          <input
            type="text"
            placeholder="Add a subtask..."
            value={newTitle}
            disabled={busy}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <button type="button" disabled={busy || !newTitle.trim()} onClick={handleAdd}>
            Add
          </button>
        </div>
      )}

      {error && <p className="modal-error">{error}</p>}
    </div>
  );
}

export default TaskSubtasks;
