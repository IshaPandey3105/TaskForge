import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import "../../layoutes/Projects.css";

import ProjectInfo from "./ProjectInfo";
import ProjectMembersPanel from "./ProjectMembersPanel";
import ProjectTasksPanel from "./ProjectTasksPanel";
import ProjectModal from "./ProjectModal";
import ProjectDeleteModal from "./ProjectDeleteModal";
import ProjectAddMemberModal from "./ProjectAddMemberModal";
import ProjectTaskModal from "./ProjectTaskModal";
import ProjectMemberRemoveModal from "./ProjectMemberRemoveModal";


function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [project, setProject] = useState(null);
  const [creator, setCreator] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Action feedback
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [roleBusyId, setRoleBusyId] = useState(null);

  // Edit project modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete project modal
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Add member modal
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({
    email: "",
    role: "member",
  });
  const [addingMember, setAddingMember] = useState(false);

  // Add task modal
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "todo",
    assignedTo: "",
  });
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState("");

  // Remove member confirm modal
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);

  const flashSuccess = (message) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(""), 4000);
  };

  const loadMembers = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectId}/members`);
      setMembers(res.data.data || []);
    } catch {
      // Keep previous members on refresh failure
    }
  }, [projectId]);

  const loadTasks = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${projectId}`);
      setTasks(res.data.data || []);
    } catch {
      // Keep previous tasks on refresh failure
    }
  }, [projectId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [projectRes, listRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get("/projects"),
      ]);

      setProject(projectRes.data.data);

      // The by-id endpoint does not populate the creator; the projects
      // list does, so use it for creator details.
      const listed = (listRes.data.data || []).find(
        (p) => p._id === projectId
      );
      setCreator(listed?.createdBy || null);

      await Promise.all([loadMembers(), loadTasks()]);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load project.");
    } finally {
      setLoading(false);
    }
  }, [projectId, loadMembers, loadTasks]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---- Permissions (existing architecture: project membership role) ----

  const myMembership = members.find((m) => m.user?._id === user?._id);
  const myRole = myMembership?.role || null;
  const canManage = myRole === "admin" || myRole === "project-admin";
  const canDelete = myRole === "admin";

  // ---- Actions ----

  const openEdit = () => {
    setEditForm({
      name: project.name || "",
      description: project.description || "",
    });
    setModalError("");
    setEditOpen(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();

    if (!editForm.name.trim()) {
      setModalError("Project name is required.");
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      const res = await api.put(`/projects/${projectId}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });

      setProject(res.data.data);
      setEditOpen(false);
      flashSuccess("Project updated successfully.");
    } catch (err) {
      setModalError(err.response?.data?.message || "Unable to save project.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    setSaving(true);
    setModalError("");

    try {
      await api.delete(`/projects/${projectId}`);
      navigate("/projects");
    } catch (err) {
      setSaving(false);
      setDeleteOpen(false);
      setActionError(
        err.response?.data?.message || "Unable to delete project."
      );
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!addMemberForm.email.trim()) {
      setActionError("Please enter the member's email address.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(addMemberForm.email.trim())) {
      setActionError("Please enter a valid email address.");
      return;
    }

    setAddingMember(true);
    setActionError("");

    try {
      await api.post(`/projects/${projectId}/members`, {
        email: addMemberForm.email.trim(),
        role: addMemberForm.role,
      });

      setAddMemberOpen(false);
      setAddMemberForm({ email: "", role: "member" });
      await loadMembers();
      flashSuccess("Member added to the project.");
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to add member.");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRoleChange = async (member, newRole) => {
    if (member.role === newRole) return;

    setRoleBusyId(member.user?._id);
    setActionError("");

    try {
      await api.put(`/projects/${projectId}/members/${member.user._id}`, {
        newRole,
      });

      setMembers((list) =>
        list.map((m) =>
          m.user?._id === member.user?._id ? { ...m, role: newRole } : m
        )
      );
      flashSuccess(
        `${member.user?.fullName || member.user?.username || "Member"} is now ${
          newRole === "project-admin" ? "a Project Admin" : "a Member"
        }.`
      );
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Unable to update member role."
      );
    } finally {
      setRoleBusyId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setRemovingMember(true);
    setActionError("");

    try {
      await api.delete(
        `/projects/${projectId}/members/${memberToRemove.user._id}`
      );

      setMemberToRemove(null);
      await Promise.all([loadMembers(), loadTasks()]);
      flashSuccess("Member removed from the project.");
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Unable to remove member."
      );
    } finally {
      setRemovingMember(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!taskForm.title.trim()) {
      setTaskError("Task title is required.");
      return;
    }

    if (!taskForm.assignedTo) {
      setTaskError("Please select an assignee.");
      return;
    }

    setSavingTask(true);
    setTaskError("");

    try {
      await api.post(`/tasks/${projectId}`, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        status: taskForm.status,
        assignedTo: taskForm.assignedTo,
      });

      setAddTaskOpen(false);
      setTaskForm({
        title: "",
        description: "",
        status: "todo",
        assignedTo: "",
      });
      await loadTasks();
      flashSuccess("Task created successfully.");
    } catch (err) {
      setTaskError(err.response?.data?.message || "Unable to create task.");
    } finally {
      setSavingTask(false);
    }
  };

  if (loading) {
    return <div className="project-details-page">Loading project...</div>;
  }

  if (error && !project) {
    return (
      <div className="project-details-page">
        <button
          type="button"
          className="project-back-btn"
          onClick={() => navigate("/projects")}
        >
          ← Back to Projects
        </button>
        <p className="projects-error">{error}</p>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="project-details-page">
      <ProjectInfo
        project={project}
        creator={creator}
        memberCount={members.length}
        canManage={canManage}
        canDelete={canDelete}
        onBack={() => navigate("/projects")}
        onEdit={openEdit}
        onDelete={() => setDeleteOpen(true)}
      />

      {actionError && <div className="projects-error">{actionError}</div>}
      {actionSuccess && (
        <div className="project-banner-success">{actionSuccess}</div>
      )}

      <div className="project-details-grid">
        <ProjectTasksPanel
          tasks={tasks}
          canManage={canManage}
          onAddTask={() => setAddTaskOpen(true)}
        />

        <ProjectMembersPanel
          members={members}
          currentUserId={user?._id}
          canManage={canManage}
          roleBusyId={roleBusyId}
          onRoleChange={handleRoleChange}
          onRequestRemove={(member) => {
            setActionError("");
            setMemberToRemove(member);
          }}
        />
      </div>

      {/* Edit project */}
      <ProjectModal
        modal={editOpen ? { mode: "edit", project } : null}
        form={editForm}
        onFormChange={setEditForm}
        error={modalError}
        saving={saving}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdateProject}
      />

      {/* Delete project */}
      <ProjectDeleteModal
        modal={deleteOpen ? { mode: "delete", project } : null}
        error={modalError}
        saving={saving}
        onClose={() => setDeleteOpen(false)}
        onDelete={handleDeleteProject}
      />

      {/* Add member */}
      <ProjectAddMemberModal
        open={addMemberOpen}
        projectName={project.name}
        form={addMemberForm}
        onFormChange={setAddMemberForm}
        error={actionError}
        adding={addingMember}
        onClose={() => setAddMemberOpen(false)}
        onSubmit={handleAddMember}
      />

      {/* Add task */}
      <ProjectTaskModal
        open={addTaskOpen}
        form={taskForm}
        onFormChange={setTaskForm}
        error={taskError}
        saving={savingTask}
        members={members}
        onClose={() => setAddTaskOpen(false)}
        onSubmit={handleCreateTask}
      />

      {/* Remove member confirmation */}
      <ProjectMemberRemoveModal
        member={memberToRemove}
        projectName={project.name}
        removing={removingMember}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
      />
    </div>
  );
}

export default ProjectDetails;