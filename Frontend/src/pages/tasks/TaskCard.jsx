import formatDate from "../../utils/formatDate";

function TaskCard({ task, onOpenDetails, renderActions }) {
  return (
    <div
      className="task-card clickable"
      onClick={() => onOpenDetails(task)}
    >
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

      <div className="task-card-actions" onClick={(e) => e.stopPropagation()}>
        {renderActions(task)}
      </div>
    </div>
  );
}

export default TaskCard;