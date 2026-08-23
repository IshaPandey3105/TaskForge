import formatDate from "../../utils/formatDate";
import { STATUS_LABELS } from "../../utils/taskStatus";

function ProjectTasksPanel({ tasks, canManage, onAddTask }) {
  const counts = { todo: 0, "in-progress": 0, done: 0 };
  tasks.forEach((t) => {
    if (counts[t.status] !== undefined) {
      counts[t.status] += 1;
    }
  });

  return (
    <section className="project-panel project-tasks-panel">
      <div className="project-panel-head">
        <h2>
          Tasks <span className="project-panel-count">{tasks.length}</span>
        </h2>

        {canManage && (
          <button
            type="button"
            className="project-add-task-btn"
            onClick={onAddTask}
          >
            + Add Task
          </button>
        )}
      </div>

      <div className="pd-task-summary">
        <span className="pd-summary-chip todo">Todo · {counts.todo}</span>
        <span className="pd-summary-chip in-progress">
          In Progress · {counts["in-progress"]}
        </span>
        <span className="pd-summary-chip done">Done · {counts.done}</span>
      </div>

      {tasks.length === 0 ? (
        <p className="project-panel-empty">No tasks yet.</p>
      ) : (
        <ul className="pd-task-list">
          {tasks.map((task) => (
            <li key={task._id} className="pd-task-item">
              <span className={`status-dot ${task.status}`} />

              <div className="pd-task-info">
                <span className="pd-task-title">{task.title}</span>
                <span className="pd-task-meta">
                  {task.assignedTo?.fullName ||
                    task.assignedTo?.username ||
                    "Unassigned"}{" "}
                  · Updated {formatDate(task.updatedAt || task.createdAt)}
                </span>
              </div>

              <span className={`status-badge ${task.status}`}>
                {STATUS_LABELS[task.status] || task.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ProjectTasksPanel;