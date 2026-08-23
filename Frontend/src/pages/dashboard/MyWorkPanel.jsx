import { useNavigate } from "react-router-dom";
import { STATUS_LABELS } from "../../utils/taskStatus";

// Tasks currently assigned to the signed-in user, most recently updated
// first. Read-only — full management lives on the Tasks page.

function MyWorkPanel({ tasks }) {
  const navigate = useNavigate();

  return (
    <section className="dash-panel insight-panel">
      <div className="dash-panel-head">
        <h2>My Work</h2>
        <button
          type="button"
          className="dash-panel-link"
          onClick={() => navigate("/tasks")}
        >
          Open Tasks →
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="dash-empty-mini">
          Nothing assigned to you right now.
        </p>
      ) : (
        <ul className="dash-row-list">
          {tasks.map((task) => (
            <li key={task._id} className="dash-row">
              <span className={`status-dot ${task.status}`} />
              <div className="dash-row-body">
                <span className="dash-row-title">{task.title}</span>
                <span className="dash-row-sub">
                  {task.project?.name || "No project"}
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

export default MyWorkPanel;