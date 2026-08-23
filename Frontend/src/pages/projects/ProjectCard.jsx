import formatDate from "../../utils/formatDate";

function ProjectCard({
  project,
  role,
  memberCount,
  taskCount,
  doneCount,
  canManage,
  canDelete,
  onOpen,
  onEdit,
  onDelete,
}) {
  return (
    <div className="project-card clickable" onClick={onOpen}>
      <div className="project-card-top">
        <h3>{project.name}</h3>
        <span className="project-card-role">{role}</span>
      </div>

      {project.description && (
        <p className="project-card-desc">{project.description}</p>
      )}

      <div className="project-card-meta">
        <span>{memberCount} members</span>
        <span>{taskCount} tasks</span>
        <span>{doneCount} done</span>
      </div>

      <div className="project-card-dates">
        <span>Created {formatDate(project.createdAt)}</span>
        <span>Updated {formatDate(project.updatedAt)}</span>
      </div>

      <div className="project-card-actions" onClick={(e) => e.stopPropagation()}>
        {canManage && (
          <button type="button" onClick={onEdit}>
            Edit
          </button>
        )}
        {canDelete && (
          <button type="button" className="danger" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default ProjectCard;