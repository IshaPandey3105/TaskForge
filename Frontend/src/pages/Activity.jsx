import {useCallback, useEffect, useMemo, useState} from "react";
import api from "../services/api";
import "./Activity.css";

const TYPE_LABELS = {
  all: "All",
  task: "Tasks",
  project: "Projects",
  note: "Notes",
  member: "Members",
};

const TIME_LABELS = {
  all: "All Time",
  today: "Today",
  week: "This Week",
  month: "This Month",
};

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

function cleanAvatar(url) {
  return url && !url.includes("placehold.co") ? url : null;
}

function formatRelativeTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString(undefined, {month: "short", day: "numeric"});
}

function formatTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit"});
}

function Activity() {
  const [projects, setProjects] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});
  const [notesByProject, setNotesByProject] = useState({});
  const [membershipsByProject, setMembershipsByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const projectsRes = await api.get("/projects");
      const projectList = projectsRes.data.data || [];
      setProjects(projectList);

      const taskPromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/tasks/${project._id}`);
          return {projectId: project._id, tasks: res.data.data || []};
        } catch {
          return {projectId: project._id, tasks: []};
        }
      });

      const notePromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/notes/${project._id}`);
          return {projectId: project._id, notes: res.data.data || []};
        } catch {
          return {projectId: project._id, notes: []};
        }
      });

      const memberPromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/projects/${project._id}/members`);
          return {
            projectId: project._id,
            members: res.data.data || [],
          };
        } catch {
          return {projectId: project._id, members: []};
        }
      });

      const [taskResults, noteResults, memberResults] = await Promise.all([
        Promise.all(taskPromises),
        Promise.all(notePromises),
        Promise.all(memberPromises),
      ]);

      const tasksMap = {};
      taskResults.forEach((r) => {
        tasksMap[r.projectId] = r.tasks;
      });

      const notesMap = {};
      noteResults.forEach((r) => {
        notesMap[r.projectId] = r.notes;
      });

      const membersMap = {};
      memberResults.forEach((r) => {
        membersMap[r.projectId] = r.members;
      });

      setTasksByProject(tasksMap);
      setNotesByProject(notesMap);
      setMembershipsByProject(membersMap);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };

    fetchData();
  }, [loadData]);

  // ---- Derive activity from real data ----

  const activities = useMemo(() => {
    const projectMap = {};
    projects.forEach((p) => {
      projectMap[p._id] = p;
    });

    const items = [];

    // Task activity: creation, updates and status completions.
    Object.entries(tasksByProject).forEach(([projectId, tasks]) => {
      const project = projectMap[projectId];
      tasks.forEach((task) => {
        const assignee = task.assignedTo;
        const actor = assignee
          ? {
              id: assignee._id,
              name: assignee.fullName || assignee.username || "Someone",
              avatarUrl: cleanAvatar(assignee.avatar?.url),
            }
          : null;

        const base = {
          type: "task",
          projectId,
          projectName: project?.name,
          itemTitle: task.title,
          actor,
        };

        items.push({
          ...base,
          id: `task-created-${task._id}`,
          action: "created",
          timestamp: task.createdAt,
        });

        if (
          task.status === "done" &&
          task.updatedAt &&
          task.updatedAt !== task.createdAt
        ) {
          items.push({
            ...base,
            id: `task-completed-${task._id}`,
            action: "completed",
            timestamp: task.updatedAt,
          });
        } else if (task.updatedAt && task.updatedAt !== task.createdAt) {
          items.push({
            ...base,
            id: `task-updated-${task._id}`,
            action: "updated",
            timestamp: task.updatedAt,
          });
        }
      });
    });

    // Note activity: creation and edits.
    Object.entries(notesByProject).forEach(([projectId, notes]) => {
      const project = projectMap[projectId];
      notes.forEach((note) => {
        const creator = note.createdBy;
        const actor = creator
          ? {
              id: creator._id,
              name: creator.fullName || creator.username || "Someone",
              avatarUrl: cleanAvatar(creator.avatar?.url),
            }
          : null;

        items.push({
          type: "note",
          projectId,
          projectName: project?.name,
          itemTitle: null,
          actor,
          id: `note-created-${note._id}`,
          action: "created",
          timestamp: note.createdAt,
        });

        if (note.updatedAt && note.updatedAt !== note.createdAt) {
          items.push({
            type: "note",
            projectId,
            projectName: project?.name,
            itemTitle: null,
            actor,
            id: `note-updated-${note._id}`,
            action: "updated",
            timestamp: note.updatedAt,
          });
        }
      });
    });

    // Project activity: creation.
    projects.forEach((project) => {
      const creator = project.createdBy;
      const actor = creator
        ? {
            id: creator._id,
            name:
              creator.fullName ||
              creator.fullname ||
              creator.username ||
              "Someone",
            avatarUrl: cleanAvatar(creator.avatar?.url),
          }
        : null;

      items.push({
        type: "project",
        projectId: project._id,
        projectName: project.name,
        itemTitle: project.name,
        actor,
        id: `project-created-${project._id}`,
        action: "created",
        timestamp: project.createdAt,
      });
    });

    // Membership activity: teammates joining projects.
    Object.entries(membershipsByProject).forEach(([projectId, members]) => {
      const project = projectMap[projectId];
      members.forEach((m) => {
        const memberUser = m.user;
        if (!memberUser) return;

        items.push({
          type: "member",
          projectId,
          projectName: project?.name,
          itemTitle: null,
          actor: {
            id: memberUser._id,
            name: memberUser.fullName || memberUser.username || "Someone",
            avatarUrl: cleanAvatar(memberUser.avatar?.url),
          },
          id: `member-joined-${projectId}-${memberUser._id}`,
          action: "joined",
          timestamp: m.createdAt,
        });
      });
    });

    return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [projects, tasksByProject, notesByProject, membershipsByProject]);

  // ---- Filtering ----

  const filteredActivities = useMemo(() => {
    let list = [...activities];

    if (typeFilter !== "all") {
      list = list.filter((a) => a.type === typeFilter);
    }

    if (timeFilter !== "all") {
      const now = new Date();
      let start;

      if (timeFilter === "today") {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (timeFilter === "week") {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === "month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      list = list.filter((a) => new Date(a.timestamp) >= start);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.itemTitle?.toLowerCase().includes(q) ||
          a.projectName?.toLowerCase().includes(q) ||
          a.actor?.name?.toLowerCase().includes(q) ||
          a.action?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [activities, typeFilter, timeFilter, search]);

  // ---- Day grouping (Today / Yesterday / This Week / Earlier) ----

  const groupedActivities = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Earlier: [],
    };

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);

    filteredActivities.forEach((item) => {
      const d = new Date(item.timestamp);

      if (d >= startOfToday) {
        groups.Today.push(item);
      } else if (d >= startOfYesterday) {
        groups.Yesterday.push(item);
      } else if (d >= startOfWeek) {
        groups["This Week"].push(item);
      } else {
        groups.Earlier.push(item);
      }
    });

    return ["Today", "Yesterday", "This Week", "Earlier"]
      .map((label) => ({label, items: groups[label]}))
      .filter((group) => group.items.length > 0);
  }, [filteredActivities]);

  // ---- Workspace Pulse ----

  const pulse = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);

    const todayCount = activities.filter(
      (a) => new Date(a.timestamp) >= startOfToday,
    ).length;
    const weekCount = activities.filter(
      (a) => new Date(a.timestamp) >= startOfWeek,
    ).length;

    const projectCounts = {};
    const memberCounts = {};
    activities.forEach((a) => {
      if (a.projectName) {
        projectCounts[a.projectName] = (projectCounts[a.projectName] || 0) + 1;
      }
      if (a.actor?.name) {
        memberCounts[a.actor.name] = (memberCounts[a.actor.name] || 0) + 1;
      }
    });

    const mostActiveProject =
      Object.entries(projectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const mostActiveMember =
      Object.entries(memberCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      todayCount,
      weekCount,
      recent: activities.slice(0, 3),
      mostActiveProject,
      mostActiveMember,
    };
  }, [activities]);

  const renderAvatar = (actor, className) => {
    if (actor?.avatarUrl) {
      return (
        <img className={className} src={actor.avatarUrl} alt={actor.name} />
      );
    }

    return (
      <span className={`${className} fallback`}>
        {getInitials(actor?.name)}
      </span>
    );
  };

  const renderActionText = (item) => {
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
  };

  if (loading) {
    return <div className="activity-page">Loading activity...</div>;
  }

  if (error && projects.length === 0) {
    return (
      <div className="activity-page">
        <h1>Activity</h1>
        <p className="activity-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="activity-page">
      {/* Header */}
      <div className="activity-header">
        <div>
          <h1>Activity</h1>
          <p>
            A chronological stream of everything happening across your
            workspace.
          </p>
        </div>
      </div>

      <div className="activity-layout">
        {/* Main timeline stream */}
        <div className="activity-main">
          {/* Toolbar */}
          <div className="activity-toolbar">
            <div className="activity-chips">
              {Object.keys(TYPE_LABELS).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={typeFilter === key ? "active" : ""}
                  onClick={() => setTypeFilter(key)}
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
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="activity-time-filter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              {Object.keys(TIME_LABELS).map((key) => (
                <option key={key} value={key}>
                  {TIME_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          {/* Grouped timeline */}
          {activities.length === 0 ? (
            <div className="activity-empty glass">
              <div className="activity-empty-icon">⬡</div>
              <h2>No activity yet</h2>
              <p>
                Activity appears here as your team creates tasks, writes notes,
                builds projects and adds members. Start working in your projects
                to see this stream come alive.
              </p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="activity-empty glass">
              <p>No activity matches your filters.</p>
            </div>
          ) : (
            <div className="activity-stream">
              {groupedActivities.map((group) => (
                <section key={group.label} className="stream-group">
                  <div className="stream-group-head">
                    <span className="stream-group-label">{group.label}</span>
                    <span className="stream-group-count">
                      {group.items.length}
                    </span>
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
                        <li
                          key={item.id}
                          className={`timeline-item ${nodeClass}`}
                        >
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
          )}
        </div>

        {/* Workspace Pulse side panel */}
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
      </div>
    </div>
  );
}

export default Activity;
