import { formatRelativeTime } from "./timeUtils";

function WorkspacePulse({ pulse }) {
  return (
    <aside className="workspace-pulse">
      <div className="pulse-head">
        <span className="pulse-live-dot" />
        <h2>Workspace Pulse</h2>
      </div>

      <div className="pulse-live glass">
        <div className="pulse-live-row">
          <span className="pulse-dot today" />
          <span className="pulse-live-label">Events today</span>
          <b className="pulse-live-value">{pulse.todayCount}</b>
        </div>

        <div className="pulse-live-row">
          <span className="pulse-dot week" />
          <span className="pulse-live-label">This week</span>
          <b className="pulse-live-value">{pulse.weekCount}</b>
        </div>
      </div>

      <div className="pulse-section">
        <span className="pulse-label">Recent Changes</span>

        {pulse.recent.length === 0 ? (
          <p className="pulse-empty">No recent changes.</p>
        ) : (
          <ul className="pulse-recent">
            {pulse.recent.map((item) => (
              <li key={item.id}>
                <span
                  className={`pulse-recent-dot ${
                    item.action === "completed" ? "status" : item.type
                  }`}
                />
                <span className="pulse-recent-text">
                  <b>{item.actor?.name || "Someone"}</b> {item.action}
                  {item.itemTitle ? ` "${item.itemTitle}"` : ""}
                </span>
                <span className="pulse-recent-time">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pulse-facts">
        <div className="pulse-fact glass">
          <span className="pulse-fact-label">Most Active Project</span>
          <span className="pulse-fact-value">
            {pulse.mostActiveProject || "—"}
          </span>
        </div>

        <div className="pulse-fact glass">
          <span className="pulse-fact-label">Most Active Member</span>
          <span className="pulse-fact-value">
            {pulse.mostActiveMember || "—"}
          </span>
        </div>
      </div>
    </aside>
  );
}

export default WorkspacePulse;