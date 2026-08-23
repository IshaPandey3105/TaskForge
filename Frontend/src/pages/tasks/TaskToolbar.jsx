import { STATUS_LABELS, STATUS_ORDER } from "../../utils/taskStatus";

function TaskToolbar({
  search,
  onSearchChange,
  projectFilter,
  onProjectFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  projects,
}) {
  return (
    <div className="tasks-toolbar">
      <input
        type="text"
        className="tasks-search"
        placeholder="Search tasks..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <select
        className="tasks-filter"
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
        className="tasks-filter"
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
      >
        <option value="all">All Statuses</option>
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        className="tasks-filter"
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
      >
        <option value="recent">Recently Updated</option>
        <option value="oldest">Oldest First</option>
        <option value="title">Title A–Z</option>
      </select>

      <div className="tasks-view-toggle">
        <button
          type="button"
          className={viewMode === "kanban" ? "active" : ""}
          onClick={() => onViewModeChange("kanban")}
        >
          Kanban
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

export default TaskToolbar;