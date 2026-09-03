import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import formatDate from "../../utils/formatDate";
import "../../layoutes/Projects.css";

import ProjectToolbar from "./ProjectToolbar";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import ProjectDeleteModal from "./ProjectDeleteModal";

function Projects() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

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
        <p className="page-tagline">Let's start by creating a project.</p>
        <p className="projects-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <p className="page-tagline">Let's start by creating a project.</p>

        {isGlobalAdmin && (
          <button type="button" className="projects-create-btn" onClick={openCreate}>
            + New Project
          </button>
        )}
      </div>

      <ProjectToolbar
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

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
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              role={rolesByProject[project._id] || "member"}
              memberCount={(membersByProject[project._id] || []).length}
              taskCount={(tasksByProject[project._id] || []).length}
              doneCount={(tasksByProject[project._id] || []).filter(
                (t) => t.status === "done"
              ).length}
              canManage={canManageProject(project)}
              canDelete={canDeleteProject(project)}
              onOpen={() => navigate(`/projects/${project._id}`)}
              onEdit={() => openEdit(project)}
              onDelete={() => openDelete(project)}
            />
          ))}
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
                  <tr
                    key={project._id}
                    className="clickable-row"
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
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
                    <td
                      className="projects-list-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
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
      <ProjectModal
        modal={modal}
        form={form}
        onFormChange={setForm}
        error={modalError}
        saving={saving}
        onClose={() => setModal(null)}
        onSubmit={handleSubmit}
      />

      {/* Delete confirmation modal */}
      <ProjectDeleteModal
        modal={modal}
        error={modalError}
        saving={saving}
        onClose={() => setModal(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default Projects;