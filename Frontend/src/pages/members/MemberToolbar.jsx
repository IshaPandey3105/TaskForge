function MemberToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  projectFilter,
  onProjectFilterChange,
  viewMode,
  onViewModeChange,
  projects,
}) {
  return (
    <div className="members-toolbar">
      <input
        type="text"
        className="members-search"
        placeholder="Search members..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <select
        className="members-filter"
        value={roleFilter}
        onChange={(e) => onRoleFilterChange(e.target.value)}
      >
        {/* "Admin" is a global role, not a project-level role — it is
            intentionally not offered as a filter/option here. */}
        <option value="all">All Roles</option>
        <option value="project-admin">Project Admin</option>
        <option value="member">Member</option>
      </select>

      <select
        className="members-filter"
        value={projectFilter}
        onChange={(e) => onProjectFilterChange(e.target.value)}
      >
        <option value="all">All Projects</option>
        {projects.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name}
          </option>
        ))}
      </select>

      <div className="members-view-toggle">
        <button
          type="button"
          className={viewMode === "grid" ? "active" : ""}
          onClick={() => onViewModeChange("grid")}
        >
          Grid
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
  );
}

export default MemberToolbar;