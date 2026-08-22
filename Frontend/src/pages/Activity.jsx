import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import useAuthStore from "../store/authStore";
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

  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Activity() {
  const user = useAuthStore((state) => state.user);

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
          return { projectId: project._id, tasks: res.data.data || [] };
        } catch {
          return { projectId: project._id, tasks: [] };
        }
      });

      const notePromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/notes/${project._id}`);
          return { projectId: project._id, notes: res.data.data || [] };
        } catch {
          return { projectId: project._id, notes: [] };
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
          return { projectId: project._id, members: [] };
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

    // Task activity: creation, updates and completions.
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

    return items.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [projects, tasksByProject, notesByProject, membershipsByProject]);

  // ---- Stats ----

  const stats = useMemo(() => {
    return {
      total: activities.length,
      task: activities.filter((a) => a.type === "task").length,
      project: activities.filter((a) => a.type === "project").length,
      note: activities.filter((a) => a.type === "note").length,
      member: activities.filter((a) => a.type === "member").length,
    };
  }, [activities]);

  const summary = useMemo(() => {
    const projectCounts = {};
    activities.forEach((a) => {
      if (a.projectName) {
        projectCounts[a.projectName] = (projectCounts[a.projectName] || 0) + 1;
      }
    });

    const mostActive =
      Object.entries(projectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const myCount = activities.filter(
      (a) => a.actor?.id && a.actor.id === user?._id
    ).length;

    return {
      mostActiveProject: mostActive,
      latest: activities[0] ? formatRelativeTime(activities[0].timestamp) : null,
      myCount,
    };
  }, [activities, user?._id]);

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
          a.action?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activities, typeFilter, timeFilter, search]);

  const renderAvatar = (actor, className) => {
    if (actor?.avatarUrl) {
      return <img className={className} src={actor.avatarUrl} alt={actor.name} />;
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
            A live feed of everything happening across your projects and team.
          </p>
        </div>
      </div>

      {/* Activity Overview */}
      <section className="activity-overview">
        <button
          type="button"
          className={`overview-stat glass total${typeFilter === "all" ? " active" : ""}`}
          onClick={() => setTypeFilter("all")}
        >
          <span className="overview-icon">◈</span>
          <span className="overview-text">
            <span className="overview-value">{stats.total}</span>
            <span className="overview-label">Total Events</span>
          </span>
        </button>

        <button
          type="button"
          className={`overview-stat glass task${typeFilter === "task" ? " active" : ""}`}
          onClick={() => setTypeFilter("task")}
        >
          <span className="overview-icon">☑</span>
          <span className="overview-text">
            <span className="overview-value">{stats.task}</span>
            <span className="overview-label">Tasks</span>
          </span>
        </button>

        <button
          type="button"
          className={`overview-stat glass project${typeFilter === "project" ? " active" : ""}`}
          onClick={() => setTypeFilter("project")}
        >
          <span className="overview-icon">▤</span>
          <span className="overview-text">
            <span className="overview-value">{stats.project}</span>
            <span className="overview-label">Projects</span>
          </span>
        </button>

        <button
          type="button"
          className={`overview-stat glass note${typeFilter === "note" ? " active" : ""}`}
          onClick={() => setTypeFilter("note")}
        >
          <span className="overview-icon">✎</span>
          <span className="overview-text">
            <span className="overview-value">{stats.note}</span>
            <span className="overview-label">Notes</span>
          </span>
        </button>

        <button
          type="button"
          className={`overview-stat glass member${typeFilter === "member" ? " active" : ""}`}
          onClick={() => setTypeFilter("member")}
        >
          <span className="overview-icon">◉</span>
          <span className="overview-text">
            <span className="overview-value">{stats.member}</span>
            <span className="overview-label">Members</span>
          </span>
        </button>
      </section>

      <div className="activity-layout">
        {/* Main feed */}
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

          {/* Timeline */}
          {activities.length === 0 ? (
            <div className="activity-empty glass">
              <div className="activity-empty-icon">⬡</div>
              <h2>No activity yet</h2>
              <p>
                Activity appears here as your team creates tasks, writes notes,
                builds projects and adds members. Start working in your
                projects to see this feed come alive.
              </p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="activity-empty glass">
              <p>No activity matches your filters.</p>
            </div>
          ) : (
            <div className="activity-feed glass">
              <ul className="timeline">
                {filteredActivities.map((item) => (
                  <li key={item.id} className={`timeline-item ${item.type}`}>
                    <span className="timeline-node">
                      {{ task: "☑", note: "✎", project: "▤", member: "◉" }[
                        item.type
                      ]}
                    </span>

                    <div className="timeline-body">
                      <div className="timeline-top">
                        {renderAvatar(item.actor, "timeline-avatar")}

                        <p className="timeline-text">
                          {renderActionText(item)}
                        </p>

                        <span className="timeline-time">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>

                      <div className="timeline-meta">
                        <span className={`type-chip ${item.type}`}>
                          {TYPE_LABELS[item.type]}
                        </span>
                        {item.projectName && (
                          <span className="project-chip">
                            {item.projectName}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Summary side panel */}
        <aside className="activity-summary">
          <h2>Activity Summary</h2>

          <div className="summary-cards">
            <div className="summary-card glass task">
              <span className="summary-icon">☑</span>
              <div className="summary-info">
                <span className="summary-value">{stats.task}</span>
                <span className="summary-label">Task Events</span>
              </div>
            </div>

            <div className="summary-card glass note">
              <span className="summary-icon">✎</span>
              <div className="summary-info">
                <span className="summary-value">{stats.note}</span>
                <span className="summary-label">Note Events</span>
              </div>
            </div>

            <div className="summary-card glass project">
              <span className="summary-icon">▤</span>
              <div className="summary-info">
                <span className="summary-value">{stats.project}</span>
                <span className="summary-label">Project Events</span>
              </div>
            </div>

            <div className="summary-card glass member">
              <span className="summary-icon">◉</span>
              <div className="summary-info">
                <span className="summary-value">{stats.member}</span>
                <span className="summary-label">Member Events</span>
              </div>
            </div>
          </div>

          <div className="summary-block glass">
            <span className="summary-block-label">Most Active Project</span>
            <span className="summary-block-value">
              {summary.mostActiveProject || "—"}
            </span>
          </div>

          <div className="summary-block glass">
            <span className="summary-block-label">Latest Activity</span>
            <span className="summary-block-value">
              {summary.latest || "—"}
            </span>
          </div>

          <div className="summary-block glass">
            <span className="summary-block-label">Your Actions</span>
            <span className="summary-block-value">{summary.myCount}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Activity;