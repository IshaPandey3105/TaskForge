import formatDate from "../../utils/formatDate";

function ProjectInfo({
  project,
  creator,
  memberCount,
  canManage,
  canDelete,
  onBack,
  onEdit,
  onDelete,
}) {
  const creatorName =
    creator?.fullName || creator?.username || "—";

  return (
    <div className="project-details-header">
      <div className="project-title-block">
        <button type="button" className="project-back-btn" onClick={onBack}>
          ← Back to Projects
        </button>

        <h1>{project.name}</h1>

        {project.description && (
          <p className="project-details-desc">{project.description}</p>
        )}

        <div className="project-meta-row">
          <span>
            <strong>Created</strong> {formatDate(project.createdAt) || "—"}
          </span>
          <span>
            <strong>Updated</strong> {formatDate(project.updatedAt) || "—"}
          </span>
          <span>
            <strong>Creator</strong> {creatorName}
          </span>
          <span>
            <strong>Members</strong> {memberCount}
          </span>
        </div>
      </div>

      {(canManage || canDelete) && (
        <div className="project-details-actions">
          {canManage && (
            <button type="button" onClick={onEdit}>
              Edit Project
            </button>
          )}
          {canDelete && (
            <button type="button" className="danger" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ProjectInfo;