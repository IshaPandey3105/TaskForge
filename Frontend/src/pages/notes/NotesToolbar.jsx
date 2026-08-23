function NotesToolbar({
  search,
  onSearchChange,
  projectFilter,
  onProjectFilterChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  projects,
}) {
  return (
    <div className="notes-toolbar">
      <input
        type="text"
        className="notes-search"
        placeholder="Search notes..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <select
        className="notes-filter"
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

      <select
        className="notes-filter"
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
      >
        <option value="recent">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>

      <div className="notes-view-toggle">
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

export default NotesToolbar;