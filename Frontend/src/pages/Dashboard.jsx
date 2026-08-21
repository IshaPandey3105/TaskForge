import {useCallback, useEffect, useMemo, useState} from "react";
import api from "../services/api";
import useAuthStore from "../store/authStore";
import Calendar from "../components/dashboard/Calendar";
import "./Dashboard.css";

const STATUS_LABELS = {
  todo: "Todo",
  "in-progress": "In Progress",
  done: "Done",
};

const STATUS_ORDER = ["todo", "in-progress", "done"];

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const [projects, setProjects] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});
  const [notesByProject, setNotesByProject] = useState({});
  const [rolesByProject, setRolesByProject] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewMode, setViewMode] = useState("kanban");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Task modal state
  const [taskModal, setTaskModal] = useState(null); // { mode: 'create'|'edit', projectId, task }
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "todo",
    assignedTo: "",
  });
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState("");

  // Note modal state
  const [noteModal, setNoteModal] = useState(null); // { mode: 'create'|'edit', projectId, note }
  const [noteContent, setNoteContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch projects the user is a member of
      const projectsRes = await api.get("/projects");
      const projectList = projectsRes.data.data || [];

      setProjects(projectList);

      // 2. Fetch tasks and notes for each project
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

      // Fetch each project's members to find the current user's project role
      const rolePromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/projects/${project._id}/members`);
          const members = res.data.data || [];
          const current = members.find((m) => m.user?._id === user?._id);
          return {projectId: project._id, role: current?.role || "member"};
        } catch {
          return {projectId: project._id, role: "member"};
        }
      });

      const [taskResults, noteResults, roleResults] = await Promise.all([
        Promise.all(taskPromises),
        Promise.all(notePromises),
        Promise.all(rolePromises),
      ]);

      const tasksMap = {};
      taskResults.forEach((r) => {
        tasksMap[r.projectId] = r.tasks;
      });

      const notesMap = {};
      noteResults.forEach((r) => {
        notesMap[r.projectId] = r.notes;
      });

      const rolesMap = {};
      roleResults.forEach((r) => {
        rolesMap[r.projectId] = r.role;
      });

      setTasksByProject(tasksMap);
      setNotesByProject(notesMap);
      setRolesByProject(rolesMap);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };

    fetchData();
  }, [loadData]);

  // Flatten all tasks across projects
  const allTasks = useMemo(() => {
    const list = [];
    Object.entries(tasksByProject).forEach(([projectId, tasks]) => {
      const project = projects.find((p) => p._id === projectId);
      tasks.forEach((task) => {
        list.push({...task, project});
      });
    });
    return list;
  }, [tasksByProject, projects]);

  // Stats
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalTasks = allTasks.length;
    const inProgress = allTasks.filter(
      (t) => t.status === "in-progress",
    ).length;
    const done = allTasks.filter((t) => t.status === "done").length;
    const todo = allTasks.filter((t) => t.status === "todo").length;

    return {
      totalProjects,
      totalTasks,
      inProgress,
      done,
      todo,
    };
  }, [projects, allTasks]);

  // Kanban columns
  const kanbanColumns = useMemo(() => {
    const cols = {
      todo: [],
      "in-progress": [],
      done: [],
    };
    allTasks.forEach((task) => {
      if (cols[task.status]) {
        cols[task.status].push(task);
      } else {
        cols.todo.push(task);
      }
    });
    return cols;
  }, [allTasks]);

  // Calendar events: use task created/updated dates as "due/event" dates
  const calendarEvents = useMemo(() => {
    return allTasks.map((task) => ({
      date: task.updatedAt || task.createdAt,
      task,
    }));
  }, [allTasks]);

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return allTasks.filter((task) => {
      const d = new Date(task.updatedAt || task.createdAt);
      return (
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [selectedDate, allTasks]);

  // Notes across projects
  const allNotes = useMemo(() => {
    const list = [];
    Object.entries(notesByProject).forEach(([projectId, notes]) => {
      const project = projects.find((p) => p._id === projectId);
      notes.forEach((note) => {
        list.push({...note, project});
      });
    });
    // Sort by most recent
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notesByProject, projects]);

  // Recent activity: derive from tasks and notes (no activity endpoint exists)
  const recentActivity = useMemo(() => {
    const items = [];

    allTasks.forEach((task) => {
      items.push({
        id: `task-${task._id}`,
        type: "task",
        text: `Task "${task.title}" updated`,
        date: task.updatedAt || task.createdAt,
        project: task.project?.name,
      });
    });

    allNotes.forEach((note) => {
      items.push({
        id: `note-${note._id}`,
        type: "note",
        text: `Note added to ${note.project?.name || "project"}`,
        date: note.createdAt,
        project: note.project?.name,
      });
    });

    return items
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [allTasks, allNotes]);

  // ---- Task CRUD ----

  const openCreateTask = (projectId) => {
    setSelectedProjectId(projectId);
    setTaskForm({
      title: "",
      description: "",
      status: "todo",
      assignedTo: "",
    });
    setTaskError("");
    setTaskModal({mode: "create", projectId, task: null});
  };

  const openEditTask = (task) => {
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      assignedTo: task.assignedTo?._id || "",
    });
    setTaskError("");
    setTaskModal({mode: "edit", projectId: task.project?._id, task});
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskModal) return;

    const {mode, projectId, task} = taskModal;

    if (!taskForm.title.trim()) {
      setTaskError("Task title is required.");
      return;
    }

    setTaskSaving(true);
    setTaskError("");

    try {
      if (mode === "create") {
        await api.post(`/tasks/${projectId}`, {
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          status: taskForm.status,
          assignedTo: taskForm.assignedTo || undefined,
        });
      } else {
        await api.put(`/tasks/${projectId}/t/${task._id}`, {
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          status: taskForm.status,
          assignedTo: taskForm.assignedTo || undefined,
        });
      }

      setTaskModal(null);
      await loadData();
    } catch (err) {
      setTaskError(err.response?.data?.message || "Unable to save task.");
    } finally {
      setTaskSaving(false);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;

    try {
      await api.delete(`/tasks/${task.project._id}/t/${task._id}`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to delete task.");
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return;

    try {
      await api.put(`/tasks/${task.project._id}/t/${task._id}`, {
        status: newStatus,
      });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to update task status.");
    }
  };

  // ---- Note CRUD ----

  const openCreateNote = (projectId) => {
    setNoteContent("");
    setNoteError("");
    setNoteModal({mode: "create", projectId, note: null});
  };

  const openEditNote = (note) => {
    setNoteContent(note.content || "");
    setNoteError("");
    setNoteModal({mode: "edit", projectId: note.project?._id, note});
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteModal) return;

    const {mode, projectId, note} = noteModal;

    if (!noteContent.trim()) {
      setNoteError("Note content is required.");
      return;
    }

    setNoteSaving(true);
    setNoteError("");

    try {
      if (mode === "create") {
        await api.post(`/notes/${projectId}`, {
          content: noteContent.trim(),
        });
      } else {
        await api.put(`/notes/${projectId}/n/${note._id}`, {
          content: noteContent.trim(),
        });
      }

      setNoteModal(null);
      await loadData();
    } catch (err) {
      setNoteError(err.response?.data?.message || "Unable to save note.");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (note) => {
    if (!window.confirm("Delete this note?")) return;

    try {
      await api.delete(`/notes/${note.project._id}/n/${note._id}`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to delete note.");
    }
  };

  const firstName = user?.fullName?.split(" ")[0] || "there";
  const roleLabel = user?.role || "member";

  if (loading) {
    return <div className="dashboard-page">Loading dashboard...</div>;
  }

  if (error && projects.length === 0) {
    return (
      <div className="dashboard-page">
        <h1>Dashboard</h1>
        <p className="dashboard-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <section className="dash-welcome">
        <h1>Welcome back, {firstName}</h1>
        <p>
          You are signed in as <strong>{roleLabel}</strong>. Here is an overview
          of your workspace.
        </p>
      </section>

      {/* Stats */}
      <section className="dash-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.totalProjects}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalTasks}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.done}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.todo}</span>
          <span className="stat-label">To Do</span>
        </div>
      </section>

      {/* Main work area + calendar */}
      <section className="dash-main-grid">
        <div className="dash-work-area">
          <div className="dash-section-header">
            <h2>My Work</h2>

            <div className="dash-view-toggle">
              <button
                type="button"
                className={viewMode === "kanban" ? "active" : ""}
                onClick={() => setViewMode("kanban")}
              >
                Kanban
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
              >
                List
              </button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="dash-empty">
              <p>No projects yet. Create a project to start tracking work.</p>
            </div>
          ) : viewMode === "kanban" ? (
            <div className="kanban-board">
              {STATUS_ORDER.map((status) => (
                <div key={status} className="kanban-column">
                  <div className="kanban-column-header">
                    <span className={`status-dot ${status}`} />
                    <span>{STATUS_LABELS[status]}</span>
                    <span className="kanban-count">
                      {kanbanColumns[status].length}
                    </span>
                  </div>

                  <div className="kanban-cards">
                    {kanbanColumns[status].length === 0 ? (
                      <p className="kanban-empty">No tasks</p>
                    ) : (
                      kanbanColumns[status].map((task) => (
                        <div key={task._id} className="task-card">
                          <div className="task-card-top">
                            <span className="task-card-title">
                              {task.title}
                            </span>
                            <span className="task-card-project">
                              {task.project?.name || "No project"}
                            </span>
                          </div>

                          {task.description && (
                            <p className="task-card-desc">{task.description}</p>
                          )}

                          <div className="task-card-meta">
                            <span className="task-card-assignee">
                              {task.assignedTo?.fullName ||
                                task.assignedTo?.username ||
                                "Unassigned"}
                            </span>
                            <span className="task-card-date">
                              {formatDate(task.updatedAt || task.createdAt)}
                            </span>
                          </div>

                          <div className="task-card-actions">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleStatusChange(task, e.target.value)
                              }
                            >
                              {STATUS_ORDER.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => openEditTask(task)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => handleDeleteTask(task)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="task-list">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allTasks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="task-list-empty">
                        No tasks yet.
                      </td>
                    </tr>
                  ) : (
                    allTasks.map((task) => (
                      <tr key={task._id}>
                        <td>{task.title}</td>
                        <td>{task.project?.name || "—"}</td>
                        <td>
                          <span className={`status-badge ${task.status}`}>
                            {STATUS_LABELS[task.status] || task.status}
                          </span>
                        </td>
                        <td>
                          {task.assignedTo?.fullName ||
                            task.assignedTo?.username ||
                            "—"}
                        </td>
                        <td>{formatDate(task.updatedAt || task.createdAt)}</td>
                        <td className="task-list-actions">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task, e.target.value)
                            }
                          >
                            {STATUS_ORDER.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => openEditTask(task)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteTask(task)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Create task */}
          {projects.length > 0 && (
            <div className="dash-create-task">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedProjectId}
                onClick={() => openCreateTask(selectedProjectId)}
              >
                + New Task
              </button>
            </div>
          )}
        </div>

        {/* Calendar */}
        <aside className="dash-calendar-panel">
          <div className="dash-section-header">
            <h2>Calendar</h2>
          </div>

          <Calendar events={calendarEvents} onSelectDate={setSelectedDate} />

          <div className="dash-calendar-detail">
            <h3>{selectedDate ? formatDate(selectedDate) : "Select a date"}</h3>

            {tasksForSelectedDate.length === 0 ? (
              <p className="dash-empty">
                {selectedDate
                  ? "No tasks on this date."
                  : "Select a date to see tasks."}
              </p>
            ) : (
              <ul className="dash-date-tasks">
                {tasksForSelectedDate.map((task) => (
                  <li key={task._id}>
                    <span className={`status-dot ${task.status}`} />
                    <span>{task.title}</span>
                    <span className="dash-date-task-project">
                      {task.project?.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>

      {/* Projects */}
      <section className="dash-section">
        <div className="dash-section-header">
          <h2>Projects</h2>
        </div>

        {projects.length === 0 ? (
          <div className="dash-empty">
            <p>You are not a member of any projects yet.</p>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((project) => {
              const taskCount = (tasksByProject[project._id] || []).length;
              const doneCount = (tasksByProject[project._id] || []).filter(
                (t) => t.status === "done",
              ).length;

              return (
                <div key={project._id} className="project-card">
                  <div className="project-card-top">
                    <h3>{project.name}</h3>
                    <span className="project-card-role">
                      {rolesByProject[project._id] || "member"}
                    </span>
                  </div>

                  {project.description && (
                    <p className="project-card-desc">{project.description}</p>
                  )}

                  <div className="project-card-meta">
                    <span>{taskCount} tasks</span>
                    <span>{doneCount} done</span>
                  </div>

                  <button
                    type="button"
                    className="project-card-open"
                    onClick={() => openCreateTask(project._id)}
                  >
                    + Add Task
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Notes + Activity */}
      <section className="dash-bottom-grid">
        <div className="dash-section">
          <div className="dash-section-header">
            <h2>Notes</h2>
          </div>

          {projects.length === 0 ? (
            <div className="dash-empty">
              <p>No projects to attach notes to.</p>
            </div>
          ) : (
            <>
              <div className="dash-create-note">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedProjectId}
                  onClick={() => openCreateNote(selectedProjectId)}
                >
                  + New Note
                </button>
              </div>

              {allNotes.length === 0 ? (
                <div className="dash-empty">
                  <p>No notes yet.</p>
                </div>
              ) : (
                <ul className="notes-list">
                  {allNotes.slice(0, 5).map((note) => (
                    <li key={note._id} className="note-item">
                      <p className="note-content">{note.content}</p>
                      <div className="note-meta">
                        <span>{note.project?.name}</span>
                        <span>
                          {note.createdBy?.fullName ||
                            note.createdBy?.username ||
                            "Unknown"}
                        </span>
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                      <div className="note-actions">
                        <button
                          type="button"
                          onClick={() => openEditNote(note)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDeleteNote(note)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="dash-section">
          <div className="dash-section-header">
            <h2>Recent Activity</h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="dash-empty">
              <p>No recent activity yet.</p>
            </div>
          ) : (
            <ul className="activity-list">
              {recentActivity.map((item) => (
                <li key={item.id} className="activity-item">
                  <span className={`activity-dot ${item.type}`} />
                  <div className="activity-body">
                    <p>{item.text}</p>
                    <span>{formatDate(item.date)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Task modal */}
      {taskModal && (
        <div className="modal-overlay" onClick={() => setTaskModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{taskModal.mode === "create" ? "New Task" : "Edit Task"}</h3>

            {taskError && <p className="modal-error">{taskError}</p>}

            <form onSubmit={handleTaskSubmit}>
              <label>
                Title
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) =>
                    setTaskForm({...taskForm, title: e.target.value})
                  }
                  placeholder="Task title"
                />
              </label>

              <label>
                Description
                <textarea
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Task description"
                  rows="3"
                />
              </label>

              <label>
                Status
                <select
                  value={taskForm.status}
                  onChange={(e) =>
                    setTaskForm({...taskForm, status: e.target.value})
                  }
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" onClick={() => setTaskModal(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={taskSaving}>
                  {taskSaving
                    ? "Saving..."
                    : taskModal.mode === "create"
                      ? "Create Task"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note modal */}
      {noteModal && (
        <div className="modal-overlay" onClick={() => setNoteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{noteModal.mode === "create" ? "New Note" : "Edit Note"}</h3>

            {noteError && <p className="modal-error">{noteError}</p>}

            <form onSubmit={handleNoteSubmit}>
              <label>
                Content
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write a note..."
                  rows="4"
                />
              </label>

              <div className="modal-actions">
                <button type="button" onClick={() => setNoteModal(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={noteSaving}>
                  {noteSaving
                    ? "Saving..."
                    : noteModal.mode === "create"
                      ? "Create Note"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
