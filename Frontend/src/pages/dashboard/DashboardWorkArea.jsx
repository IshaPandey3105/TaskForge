import { STATUS_LABELS, STATUS_ORDER } from "../../utils/taskStatus";
import formatDate from "../../utils/formatDate";

function DashboardWorkArea({
  projects,
  viewMode,
  onViewModeChange,
  kanbanColumns,
  allTasks,
  selectedProjectId,
  onSelectProject,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) {
  return (
    <div className="dash-work-area">
      <div className="dash-section-header">
        <h2>My Work</h2>

        <div className="dash-view-toggle">
          <button
            type="button"
            className={viewMode === "kanban" ? "active" : ""}
            onClick={() => onViewModeChange("kanban")}
          >
            Kanban
          </button>
          <button
            type="button"
            className={viewMode === "list" ? "active" : ""}
            onClick={() => onViewModeChange("list")}
          >
            List
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="dash-empty">
          <p>No projects yet. Create a project to start tracking work.</p>
        </div>
      ) : viewMode === "kanban" ? (
        <div className="kanban-board">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="kanban-column">
              <div className="kanban-column-header">
                <span className={`status-dot ${status}`} />
                <span>{STATUS_LABELS[status]}</span>
                <span className="kanban-count">
                  {kanbanColumns[status].length}
                </span>
              </div>

              <div className="kanban-cards">
                {kanbanColumns[status].length === 0 ? (
                  <p className="kanban-empty">No tasks</p>
                ) : (
                  kanbanColumns[status].map((task) => (
                    <div key={task._id} className="task-card">
                      <div className="task-card-top">
                        <span className="task-card-title">{task.title}</span>
                        <span className="task-card-project">
                          {task.project?.name || "No project"}
                        </span>
                      </div>

                      {task.description && (
                        <p className="task-card-desc">{task.description}</p>
                      )}

                      <div className="task-card-meta">
                        <span className="task-card-assignee">
                          {task.assignedTo?.fullName ||
                            task.assignedTo?.username ||
                            "Unassigned"}
                        </span>
                        <span className="task-card-date">
                          {formatDate(task.updatedAt || task.createdAt)}
                        </span>
                      </div>

                      <div className="task-card-actions">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            onStatusChange(task, e.target.value)
                          }
                        >
                          {STATUS_ORDER.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>

                        <button type="button" onClick={() => onEditTask(task)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => onDeleteTask(task)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="task-list">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="task-list-empty">
                    No tasks yet.
                  </td>
                </tr>
              ) : (
                allTasks.map((task) => (
                  <tr key={task._id}>
                    <td>{task.title}</td>
                    <td>{task.project?.name || "—"}</td>
                    <td>
                      <span className={`status-badge ${task.status}`}>
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                    </td>
                    <td>
                      {task.assignedTo?.fullName ||
                        task.assignedTo?.username ||
                        "—"}
                    </td>
                    <td>{formatDate(task.updatedAt || task.createdAt)}</td>
                    <td className="task-list-actions">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          onStatusChange(task, e.target.value)
                        }
                      >
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={() => onEditTask(task)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => onDeleteTask(task)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create task */}
      {projects.length > 0 && (
        <div className="dash-create-task">
          <select
            value={selectedProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
          >
            <option value="">Select project...</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedProjectId}
            onClick={() => onCreateTask(selectedProjectId)}
          >
            + New Task
          </button>
        </div>
      )}
    </div>
  );
}

export default DashboardWorkArea;