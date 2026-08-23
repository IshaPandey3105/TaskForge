import { TYPE_LABELS, TIME_LABELS } from "./constants";

function ActivityToolbar({
  typeFilter,
  onTypeFilterChange,
  search,
  onSearchChange,
  timeFilter,
  onTimeFilterChange,
}) {
  return (
    <div className="activity-toolbar">
      <div className="activity-chips">
        {Object.keys(TYPE_LABELS).map((key) => (
          <button
            key={key}
            type="button"
            className={typeFilter === key ? "active" : ""}
            onClick={() => onTypeFilterChange(key)}
          >
            {TYPE_LABELS[key]}
          </button>
        ))}
      </div>

      <input
        type="text"
        className="activity-search"
        placeholder="Search activity..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <select
        className="activity-time-filter"
        value={timeFilter}
        onChange={(e) => onTimeFilterChange(e.target.value)}
      >
        {Object.keys(TIME_LABELS).map((key) => (
          <option key={key} value={key}>
            {TIME_LABELS[key]}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ActivityToolbar;