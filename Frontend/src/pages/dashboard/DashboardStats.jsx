function DashboardStats({ stats }) {
  return (
    <section className="dash-stats">
      <div className="stat-card">
        <span className="stat-value">{stats.totalProjects}</span>
        <span className="stat-label">Projects</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats.totalTasks}</span>
        <span className="stat-label">Total Tasks</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats.inProgress}</span>
        <span className="stat-label">In Progress</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats.done}</span>
        <span className="stat-label">Completed</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats.todo}</span>
        <span className="stat-label">To Do</span>
      </div>
    </section>
  );
}

export default DashboardStats;