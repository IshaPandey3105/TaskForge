import formatDate from "../../utils/formatDate";
import { STATUS_LABELS } from "../../utils/taskStatus";

// Most recently updated tasks across the workspace, based on real
// updatedAt timestamps.

function RecentActivityPanel({ tasks }) {
  return (
    <section className="dash-panel insight-panel">
      <div className="dash-panel-head">
        <h2>Recent Task Activity</h2>
      </div>

      {tasks.length === 0 ? (
        <p className="dash-empty-mini">No task activity yet.</p>
      ) : (
        <ul className="dash-row-list">
          {tasks.map((task) => (
            <li key={task._id} className="dash-row">
              <span className={`status-dot ${task.status}`} />
              <div className="dash-row-body">
                <span className="dash-row-title">{task.title}</span>
                <span className="dash-row-sub">
                  {task.project?.name || "No project"} ·{" "}
                  {formatDate(task.updatedAt || task.createdAt)}
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

export default RecentActivityPanel;