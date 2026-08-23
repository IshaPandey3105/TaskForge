import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import { STATUS_LABELS, STATUS_ORDER } from "../../utils/taskStatus";
import formatDate from "../../utils/formatDate";
import "../../layoutes/Tasks.css";

import TaskToolbar from "./TaskToolbar";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import TaskDetails from "./TaskDetails";
import TaskDeleteModal from "./TaskDeleteModal";

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
      <TaskToolbar
        search={search}
        onSearchChange={setSearch}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        projects={projects}
      />

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
                    <TaskCard
                      key={task._id}
                      task={task}
                      onOpenDetails={openDetails}
                      renderActions={renderTaskActions}
                    />
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
      <TaskModal
        modal={taskModal}
        form={form}
        onFormChange={setForm}
        error={modalError}
        saving={saving}
        onClose={() => setTaskModal(null)}
        onSubmit={handleSubmit}
        manageableProjects={manageableProjects}
        membersByProject={membersByProject}
      />

      {/* Details modal */}
      <TaskDetails
        modal={detailModal}
        canManage={
          detailModal ? canManageProject(detailModal.task.project?._id) : false
        }
        onClose={() => setDetailModal(null)}
        onEdit={(task) => {
          setDetailModal(null);
          openEdit(task);
        }}
      />

      {/* Delete confirmation modal */}
      <TaskDeleteModal
        modal={deleteModal}
        deleting={deleting}
        error={deleteError}
        onClose={() => setDeleteModal(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default Tasks;