function DashboardProjectsSection({
  projects,
  tasksByProject,
  rolesByProject,
  onAddTask,
}) {
  return (
    <section className="dash-section">
      <div className="dash-section-header">
        <h2>Projects</h2>
      </div>

      {projects.length === 0 ? (
        <div className="dash-empty">
          <p>You are not a member of any projects yet.</p>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => {
            const taskCount = (tasksByProject[project._id] || []).length;
            const doneCount = (tasksByProject[project._id] || []).filter(
              (t) => t.status === "done",
            ).length;

            return (
              <div key={project._id} className="project-card">
                <div className="project-card-top">
                  <h3>{project.name}</h3>
                  <span className="project-card-role">
                    {rolesByProject[project._id] || "member"}
                  </span>
                </div>

                {project.description && (
                  <p className="project-card-desc">{project.description}</p>
                )}

                <div className="project-card-meta">
                  <span>{taskCount} tasks</span>
                  <span>{doneCount} done</span>
                </div>

                <button
                  type="button"
                  className="project-card-open"
                  onClick={() => onAddTask(project._id)}
                >
                  + Add Task
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default DashboardProjectsSection;