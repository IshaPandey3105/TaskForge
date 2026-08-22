import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import useAuthStore from "../store/authStore";
import "./Tasks.css";

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

function Tasks() {
  const user = useAuthStore((state) => state.user);

  const [projects, setProjects] = useState([]);
  const [rolesByProject, setRolesByProject] = useState({});
  const [membersByProject, setMembersByProject] = useState({});
  const [tasksByProject, setTasksByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters / view
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("kanban");

  // Create / Edit modal
  const [taskModal, setTaskModal] = useState(null); // { mode, projectId, task }
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    assignedTo: "",
    projectId: "",
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Details modal
  const [detailModal, setDetailModal] = useState(null); // { task, loading, subtasks }

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(null); // { task }
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const globalRole = user?.role || "member";
  const isGlobalAdmin = globalRole === "admin";

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

      const memberPromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/projects/${project._id}/members`);
          const members = res.data.data || [];
          const current = members.find((m) => m.user?._id === user?._id);
          return {
            projectId: project._id,
            role: current?.role || "member",
            members,
          };
        } catch {
          return { projectId: project._id, role: "member", members: [] };
        }
      });

      const [taskResults, memberResults] = await Promise.all([
        Promise.all(taskPromises),
        Promise.all(memberPromises),
      ]);

      const tasksMap = {};
      taskResults.forEach((r) => {
        tasksMap[r.projectId] = r.tasks;
      });

      const rolesMap = {};
      const membersMap = {};
      memberResults.forEach((r) => {
        rolesMap[r.projectId] = r.role;
        membersMap[r.projectId] = r.members;
      });

      setTasksByProject(tasksMap);
      setRolesByProject(rolesMap);
      setMembersByProject(membersMap);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load tasks.");
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

  // ---- Derived data ----

  const allTasks = useMemo(() => {
    const list = [];
    Object.entries(tasksByProject).forEach(([projectId, tasks]) => {
      const project = projects.find((p) => p._id === projectId);
      tasks.forEach((task) => {
        list.push({ ...task, project });
      });
    });
    return list;
  }, [tasksByProject, projects]);

  const myTaskCount = useMemo(
    () => allTasks.filter((t) => t.assignedTo?._id === user?._id).length,
    [allTasks, user?._id]
  );

  const stats = useMemo(() => {
    return {
      total: allTasks.length,
      todo: allTasks.filter((t) => t.status === "todo").length,
      inProgress: allTasks.filter((t) => t.status === "in-progress").length,
      done: allTasks.filter((t) => t.status === "done").length,
      mine: myTaskCount,
    };
  }, [allTasks, myTaskCount]);

  const filteredTasks = useMemo(() => {
    let list = [...allTasks];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    if (projectFilter !== "all") {
      list = list.filter((t) => t.project?._id === projectFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }

    if (sortBy === "recent") {
      list.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      );
    } else if (sortBy === "oldest") {
      list.sort(
        (a, b) =>
          new Date(a.createdAt) - new Date(b.createdAt)
      );
    } else if (sortBy === "title") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return list;
  }, [allTasks, search, projectFilter, statusFilter, sortBy]);

  const kanbanColumns = useMemo(() => {
    const cols = { todo: [], "in-progress": [], done: [] };
    filteredTasks.forEach((task) => {
      if (cols[task.status]) {
        cols[task.status].push(task);
      } else {
        cols.todo.push(task);
      }
    });
    return cols;
  }, [filteredTasks]);

  // ---- Permissions (existing architecture: project-level roles) ----

  const canManageProject = useCallback(
    (projectId) => {
      if (isGlobalAdmin) return true;
      const role = rolesByProject[projectId];
      return role === "admin" || role === "project-admin";
    },
    [isGlobalAdmin, rolesByProject]
  );

  const manageableProjects = useMemo(
    () => projects.filter((p) => canManageProject(p._id)),
    [projects, canManageProject]
  );

  // ---- Modals ----

  const openCreate = () => {
    const defaultProject =
      projectFilter !== "all" && canManageProject(projectFilter)
        ? projectFilter
        : manageableProjects[0]?._id || "";

    setForm({
      title: "",
      description: "",
      status: "todo",
      assignedTo: "",
      projectId: defaultProject,
    });
    setModalError("");
    setTaskModal({ mode: "create", projectId: defaultProject, task: null });
  };

  const openEdit = (task) => {
    setForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      assignedTo: task.assignedTo?._id || "",
      projectId: task.project?._id || "",
    });
    setModalError("");
    setTaskModal({ mode: "edit", projectId: task.project?._id, task });
  };

  const openDetails = async (task) => {
    setDetailModal({ task, loading: true, subtasks: [] });

    try {
      const res = await api.get(`/tasks/${task.project._id}/t/${task._id}`);
      setDetailModal({
        task: { ...task, ...res.data.data },
        loading: false,
        subtasks: res.data.data?.subtasks || [],
      });
    } catch {
      // Fall back to the list data we already have
      setDetailModal({ task, loading: false, subtasks: [] });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskModal) return;

    const { mode, task } = taskModal;

    if (!form.title.trim()) {
      setModalError("Task title is required.");
      return;
    }

    if (mode === "create" && !form.projectId) {
      setModalError("Please select a project.");
      return;
    }

    if (mode === "create" && !form.assignedTo) {
      setModalError("Please select an assignee.");
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      if (mode === "create") {
        await api.post(`/tasks/${form.projectId}`, {
          title: form.title.trim(),
          description: form.description.trim(),
          status: form.status,
          assignedTo: form.assignedTo,
        });
      } else {
        await api.put(`/tasks/${task.project._id}/t/${task._id}`, {
          title: form.title.trim(),
          description: form.description.trim(),
          status: form.status,
          ...(form.assignedTo ? { assignedTo: form.assignedTo } : {}),
        });
      }

      setTaskModal(null);
      await loadData();
    } catch (err) {
      setModalError(err.response?.data?.message || "Unable to save task.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal?.task) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await api.delete(
        `/tasks/${deleteModal.task.project._id}/t/${deleteModal.task._id}`
      );
      setDeleteModal(null);
      await loadData();
    } catch (err) {
      setDeleteError(
        err.response?.data?.message || "Unable to delete task."
      );
    } finally {
      setDeleting(false);
    }
  };

  const renderTaskActions = (task) => (
    <>
      <select
        value={task.status}
        onChange={(e) => handleStatusChange(task, e.target.value)}
        onClick={(e) => e.stopPropagation()}
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      {canManageProject(task.project?._id) && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(task);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="danger"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteError("");
              setDeleteModal({ task });
            }}
          >
            Delete
          </button>
        </>
      )}
    </>
  );

  if (loading) {
    return <div className="tasks-page">Loading tasks...</div>;
  }

  if (error && projects.length === 0) {
    return (
      <div className="tasks-page">
        <h1>Tasks</h1>
        <p className="tasks-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      {/* Header */}
      <div className="tasks-header">
        <div>
          <h1>Tasks</h1>
          <p>Track and manage work across all your projects.</p>
        </div>

        <button
          type="button"
          className="tasks-create-btn"
          onClick={openCreate}
          disabled={manageableProjects.length === 0}
          title={
            manageableProjects.length === 0
              ? "You need project admin rights to create tasks"
              : undefined
          }
        >
          + New Task
        </button>
      </div>

      {/* Stats */}
      <section className="tasks-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.todo}</span>
          <span className="stat-label">Todo</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.done}</span>
          <span className="stat-label">Done</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.mine}</span>
          <span className="stat-label">My Tasks</span>
        </div>
      </section>

      {/* Toolbar */}
      <div className="tasks-toolbar">
        <input
          type="text"
          className="tasks-search"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="tasks-filter"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
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
          onChange={(e) => setStatusFilter(e.target.value)}
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
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Recently Updated</option>
          <option value="oldest">Oldest First</option>
          <option value="title">Title A–Z</option>
        </select>

        <div className="tasks-view-toggle">
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

      {/* Content */}
      {projects.length === 0 ? (
        <div className="tasks-empty">
          <p>
            You are not a member of any projects yet. Join or create a project
            to start tracking tasks.
          </p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="tasks-empty">
          <p>
            {allTasks.length === 0
              ? "No tasks yet."
              : "No tasks match your filters."}
          </p>
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
                    <div
                      key={task._id}
                      className="task-card clickable"
                      onClick={() => openDetails(task)}
                    >
                      <div className="task-card-top">
                        <span className="task-card-title">{task.title}</span>
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

                      <div
                        className="task-card-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {renderTaskActions(task)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tasks-list">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task._id}
                  className="clickable-row"
                  onClick={() => openDetails(task)}
                >
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
                  <td>{formatDate(task.createdAt)}</td>
                  <td>{formatDate(task.updatedAt)}</td>
                  <td
                    className="tasks-list-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renderTaskActions(task)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      {taskModal && (
        <div className="modal-overlay" onClick={() => setTaskModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{taskModal.mode === "create" ? "New Task" : "Edit Task"}</h3>

            {modalError && <p className="modal-error">{modalError}</p>}

            <form onSubmit={handleSubmit}>
              {taskModal.mode === "create" && (
                <label>
                  Project
                  <select
                    value={form.projectId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        projectId: e.target.value,
                        assignedTo: "",
                      })
                    }
                  >
                    <option value="">Select project...</option>
                    {manageableProjects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Title
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="Task title"
                />
              </label>

              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Task description"
                  rows="3"
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Assignee
                {taskModal.mode === "create" && (
                  <span className="modal-required">required</span>
                )}
                <select
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                >
                  <option value="">
                    {taskModal.mode === "create"
                      ? "Select assignee..."
                      : "Unassigned"}
                  </option>
                  {(membersByProject[
                    taskModal.mode === "create"
                      ? form.projectId
                      : taskModal.projectId
                  ] || []).map((member) => (
                    <option key={member.user?._id} value={member.user?._id}>
                      {member.user?.fullName || member.user?.username}
                    </option>
                  ))}
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" onClick={() => setTaskModal(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving
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

      {/* Details modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{detailModal.task.title}</h3>

            <div className="task-detail-grid">
              <div className="task-detail-row">
                <span className="task-detail-label">Status</span>
                <span
                  className={`status-badge ${detailModal.task.status}`}
                >
                  {STATUS_LABELS[detailModal.task.status] ||
                    detailModal.task.status}
                </span>
              </div>

              <div className="task-detail-row">
                <span className="task-detail-label">Project</span>
                <span className="task-detail-value">
                  {detailModal.task.project?.name || "—"}
                </span>
              </div>

              <div className="task-detail-row">
                <span className="task-detail-label">Assignee</span>
                <span className="task-detail-value">
                  {detailModal.task.assignedTo?.fullName ||
                    detailModal.task.assignedTo?.username ||
                    "Unassigned"}
                </span>
              </div>

              <div className="task-detail-row">
                <span className="task-detail-label">Created</span>
                <span className="task-detail-value">
                  {formatDate(detailModal.task.createdAt) || "—"}
                </span>
              </div>

              <div className="task-detail-row">
                <span className="task-detail-label">Updated</span>
                <span className="task-detail-value">
                  {formatDate(detailModal.task.updatedAt) || "—"}
                </span>
              </div>
            </div>

            {detailModal.task.description && (
              <div className="task-detail-desc">
                <span className="task-detail-label">Description</span>
                <p>{detailModal.task.description}</p>
              </div>
            )}

            <div className="task-detail-subtasks">
              <span className="task-detail-label">Subtasks</span>

              {detailModal.loading ? (
                <p className="task-detail-loading">Loading subtasks...</p>
              ) : detailModal.subtasks.length === 0 ? (
                <p className="task-detail-none">No subtasks.</p>
              ) : (
                <ul>
                  {detailModal.subtasks.map((sub) => (
                    <li key={sub._id}>
                      <span
                        className={`subtask-check ${
                          sub.isCompleted ? "done" : ""
                        }`}
                      >
                        {sub.isCompleted ? "✓" : ""}
                      </span>
                      <span
                        className={
                          sub.isCompleted ? "subtask-title done" : "subtask-title"
                        }
                      >
                        {sub.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setDetailModal(null)}>
                Close
              </button>
              {canManageProject(detailModal.task.project?._id) && (
                <button
                  type="button"
                  className="modal-primary"
                  onClick={() => {
                    const task = detailModal.task;
                    setDetailModal(null);
                    openEdit(task);
                  }}
                >
                  Edit Task
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Task?</h3>
            <p className="modal-text">
              This will permanently delete "{deleteModal.task.title}". This
              action cannot be undone.
            </p>

            {deleteError && <p className="modal-error">{deleteError}</p>}

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;