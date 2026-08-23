import { formatTime, formatRelativeTime } from "./timeUtils";

const NODE_ICONS = {
  task: "☑",
  note: "✎",
  project: "▤",
  member: "◉",
  status: "✓",
};

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function renderAvatar(actor, className) {
  if (actor?.avatarUrl) {
    return <img className={className} src={actor.avatarUrl} alt={actor.name} />;
  }

  return (
    <span className={`${className} fallback`}>
      {getInitials(actor?.name)}
    </span>
  );
}

function renderActionText(item) {
  const actorName = item.actor?.name || "Someone";

  switch (`${item.type}-${item.action}`) {
    case "task-created":
      return (
        <>
          <b>{actorName}</b> created task{" "}
          <span className="activity-item-name">"{item.itemTitle}"</span>
        </>
      );
    case "task-updated":
      return (
        <>
          <b>{actorName}</b> updated task{" "}
          <span className="activity-item-name">"{item.itemTitle}"</span>
        </>
      );
    case "task-completed":
      return (
        <>
          <b>{actorName}</b> completed task{" "}
          <span className="activity-item-name">"{item.itemTitle}"</span>
        </>
      );
    case "note-created":
      return (
        <>
          <b>{actorName}</b> added a note
        </>
      );
    case "note-updated":
      return (
        <>
          <b>{actorName}</b> updated a note
        </>
      );
    case "project-created":
      return (
        <>
          <b>{actorName}</b> created the project{" "}
          <span className="activity-item-name">{item.projectName}</span>
        </>
      );
    case "member-joined":
      return (
        <>
          <b>{actorName}</b> joined the project
        </>
      );
    default:
      return (
        <>
          <b>{actorName}</b> {item.action}
        </>
      );
  }
}

function ActivityTimeline({ groups }) {
  return (
    <div className="activity-stream">
      {groups.map((group) => (
        <section key={group.label} className="stream-group">
          <div className="stream-group-head">
            <span className="stream-group-label">{group.label}</span>
            <span className="stream-group-count">{group.items.length}</span>
            <span className="stream-group-rule" />
          </div>

          <ul className="timeline">
            {group.items.map((item) => {
              const isStatus = item.action === "completed";
              const nodeClass = isStatus ? "status" : item.type;
              const nodeIcon = isStatus
                ? NODE_ICONS.status
                : NODE_ICONS[item.type];

              return (
                <li key={item.id} className={`timeline-item ${nodeClass}`}>
                  <span className="timeline-node">{nodeIcon}</span>

                  <div className="timeline-body">
                    <div className="timeline-row">
                      {renderAvatar(item.actor, "timeline-avatar")}

                      <p className="timeline-text">
                        {renderActionText(item)}
                      </p>

                      <span className="timeline-time">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>

                    <div className="timeline-sub">
                      {item.projectName && (
                        <span className="project-chip">
                          {item.projectName}
                        </span>
                      )}
                      <span className="timeline-relative">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default ActivityTimeline;
