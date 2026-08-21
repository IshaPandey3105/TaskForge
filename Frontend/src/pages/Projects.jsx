import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import useAuthStore from "../store/authStore";
import "./Projects.css";

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

function Projects() {
  const user = useAuthStore((state) => state.user);

  const [projects, setProjects] = useState([]);
  const [rolesByProject, setRolesByProject] = useState({});
  const [membersByProject, setMembersByProject] = useState({});
  const [tasksByProject, setTasksByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");

  // Modal state
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit'|'delete', project }
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const globalRole = user?.role || "member";
  const isGlobalAdmin = globalRole === "admin";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const projectsRes = await api.get("/projects");
      const projectList = projectsRes.data.data || [];
      setProjects(projectList);

      // Fetch roles, members, and tasks for each project
      const rolePromises = projectList.map(async (project) => {
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

      const taskPromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/tasks/${project._id}`);
          return { projectId: project._id, tasks: res.data.data || [] };
        } catch {
          return { projectId: project._id, tasks: [] };
        }
      });

      
      const [roleResults, taskResults] = await Promise.all([
        Promise.all(rolePromises),
        Promise.all(taskPromises),
      ]);

      const rolesMap = {};
      const membersMap = {};
      roleResults.forEach((r) => {
        rolesMap[r.projectId] = r.role;
        membersMap[r.projectId] = r.members;
      });

      const tasksMap = {};
      taskResults.forEach((r) => {
        tasksMap[r.projectId] = r.tasks;
      });

      setRolesByProject(rolesMap);
      setMembersByProject(membersMap);
      setTasksByProject(tasksMap);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load projects.");
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

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const canManageProject = (project) => {
    if (isGlobalAdmin) return true;
    const role = rolesByProject[project._id];
    return role === "admin" || role === "project-admin";
  };

  const canDeleteProject = (project) => {
    if (isGlobalAdmin) return true;
    return rolesByProject[project._id] === "admin";
  };

  const openCreate = () => {
    setForm({ name: "", description: "" });
    setModalError("");
    setModal({ mode: "create", project: null });
  };

  const openEdit = (project) => {
    setForm({ name: project.name || "", description: project.description || "" });
    setModalError("");
    setModal({ mode: "edit", project });
  };

  const openDelete = (project) => {
    setModalError("");
    setModal({ mode: "delete", project });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modal) return;

    if (!form.name.trim()) {
      setModalError("Project name is required.");
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      if (modal.mode === "create") {
        await api.post("/projects", {
          name: form.name.trim(),
          description: form.description.trim(),
        });
      } else if (modal.mode === "edit") {
        await api.put(`/projects/${modal.project._id}`, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
      }

      setModal(null);
      await loadData();
    } catch (err) {
      setModalError(err.response?.data?.message || "Unable to save project.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!modal?.project) return;

    setSaving(true);
    setModalError("");

    try {
      await api.delete(`/projects/${modal.project._id}`);
      setModal(null);
      await loadData();
    } catch (err) {
      setModalError(err.response?.data?.message || "Unable to delete project.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="projects-page">Loading projects...</div>;
  }

  if (error && projects.length === 0) {
    return (
      <div className="projects-page">
        <h1>Projects</h1>
        <p className="projects-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p>Manage your project workspaces.</p>
        </div>

        {isGlobalAdmin && (
          <button type="button" className="projects-create-btn" onClick={openCreate}>
            + New Project
          </button>
        )}
      </div>

      <div className="projects-toolbar">
        <input
          type="text"
          className="projects-search"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="projects-view-toggle">
          <button
            type="button"
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
          >
            Grid
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

      {filteredProjects.length === 0 ? (
        <div className="projects-empty">
          <p>
            {search
              ? "No projects match your search."
              : "You are not a member of any projects yet."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="projects-grid">
          {filteredProjects.map((project) => {
            const role = rolesByProject[project._id] || "member";
            const memberCount = (membersByProject[project._id] || []).length;
            const taskCount = (tasksByProject[project._id] || []).length;
            const doneCount = (tasksByProject[project._id] || []).filter(
              (t) => t.status === "done"
            ).length;

            return (
              <div key={project._id} className="project-card">
                <div className="project-card-top">
                  <h3>{project.name}</h3>
                  <span className="project-card-role">{role}</span>
                </div>

                {project.description && (
                  <p className="project-card-desc">{project.description}</p>
                )}

                <div className="project-card-meta">
                  <span>{memberCount} members</span>
                  <span>{taskCount} tasks</span>
                  <span>{doneCount} done</span>
                </div>

                <div className="project-card-dates">
                  <span>Created {formatDate(project.createdAt)}</span>
                  <span>Updated {formatDate(project.updatedAt)}</span>
                </div>

                <div className="project-card-actions">
                  {canManageProject(project) && (
                    <button type="button" onClick={() => openEdit(project)}>
                      Edit
                    </button>
                  )}
                  {canDeleteProject(project) && (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => openDelete(project)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="projects-list">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Role</th>
                <th>Members</th>
                <th>Tasks</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const role = rolesByProject[project._id] || "member";
                const memberCount = (membersByProject[project._id] || []).length;
                const taskCount = (tasksByProject[project._id] || []).length;

                return (
                  <tr key={project._id}>
                    <td>{project.name}</td>
                    <td className="projects-list-desc">
                      {project.description || "—"}
                    </td>
                    <td>
                      <span className="project-card-role">{role}</span>
                    </td>
                    <td>{memberCount}</td>
                    <td>{taskCount}</td>
                    <td>{formatDate(project.createdAt)}</td>
                    <td className="projects-list-actions">
                      {canManageProject(project) && (
                        <button type="button" onClick={() => openEdit(project)}>
                          Edit
                        </button>
                      )}
                      {canDeleteProject(project) && (
                        <button
                          type="button"
                          className="danger"
                          onClick={() => openDelete(project)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      {modal && modal.mode !== "delete" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modal.mode === "create" ? "New Project" : "Edit Project"}</h3>

            {modalError && <p className="modal-error">{modalError}</p>}

            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Project name"
                />
              </label>

              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Project description"
                  rows="3"
                />
              </label>

              <div className="modal-actions">
                <button type="button" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : modal.mode === "create"
                      ? "Create Project"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {modal && modal.mode === "delete" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Project?</h3>
            <p className="modal-text">
              This will permanently delete "{modal.project.name}" and all its
              memberships. This action cannot be undone.
            </p>

            {modalError && <p className="modal-error">{modalError}</p>}

            <div className="modal-actions">
              <button type="button" onClick={() => setModal(null)} disabled={saving}>
                Cancel
              </button>
              <button
                type="button"
                className="modal-danger"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;