function ProjectToolbar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="projects-toolbar">
      <input
        type="text"
        className="projects-search"
        placeholder="Search projects..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <div className="projects-view-toggle">
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

export default ProjectToolbar;