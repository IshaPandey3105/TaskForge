function TeamOverview({ stats }) {
  return (
    <aside className="team-overview">
      <h2>Team Overview</h2>
      <p className="team-overview-sub">
        Role distribution across your projects
      </p>

      <div className="overview-total">
        <span className="overview-total-value">{stats.total}</span>
        <span className="overview-total-label">Total Members</span>
      </div>

      {stats.total > 0 && (
        <div className="overview-bar">
          {stats.admins > 0 && (
            <span
              className="overview-seg admin"
              style={{ width: `${(stats.admins / stats.total) * 100}%` }}
            />
          )}
          {stats.projectAdmins > 0 && (
            <span
              className="overview-seg project-admin"
              style={{
                width: `${(stats.projectAdmins / stats.total) * 100}%`,
              }}
            />
          )}
          {stats.members > 0 && (
            <span
              className="overview-seg member"
              style={{ width: `${(stats.members / stats.total) * 100}%` }}
            />
          )}
        </div>
      )}

      <div className="overview-pills">
        <span className="overview-pill admin">
          <span className="pill-dot" />
          Admins
          <b>{stats.admins}</b>
        </span>
        <span className="overview-pill project-admin">
          <span className="pill-dot" />
          Project Admins
          <b>{stats.projectAdmins}</b>
        </span>
        <span className="overview-pill member">
          <span className="pill-dot" />
          Members
          <b>{stats.members}</b>
        </span>
      </div>
    </aside>
  );
}

export default TeamOverview;