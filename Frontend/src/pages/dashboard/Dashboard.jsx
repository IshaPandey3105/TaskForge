import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import "../../layoutes/Dashboard.css";

import DashboardStats from "./DashboardStats";
import DashboardWorkArea from "./DashboardWorkArea";
import DashboardCalendarPanel from "./DashboardCalendarPanel";
import DashboardProjectsSection from "./DashboardProjectsSection";
import DashboardNotesSection from "./DashboardNotesSection";
import DashboardActivitySection from "./DashboardActivitySection";
import DashboardTaskModal from "./DashboardTaskModal";
import DashboardNoteModal from "./DashboardNoteModal";

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

      // Fetch each project's members to find the current user's project role
      const rolePromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/projects/${project._id}/members`);
          const members = res.data.data || [];
          const current = members.find((m) => m.user?._id === user?._id);
          return { projectId: project._id, role: current?.role || "member" };
        } catch {
          return { projectId: project._id, role: "member" };
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
        list.push({ ...task, project });
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
        list.push({ ...note, project });
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
    setTaskModal({ mode: "create", projectId, task: null });
  };

  const openEditTask = (task) => {
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      assignedTo: task.assignedTo?._id || "",
    });
    setTaskError("");
    setTaskModal({ mode: "edit", projectId: task.project?._id, task });
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskModal) return;

    const { mode, projectId, task } = taskModal;

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
    setNoteModal({ mode: "create", projectId, note: null });
  };

  const openEditNote = (note) => {
    setNoteContent(note.content || "");
    setNoteError("");
    setNoteModal({ mode: "edit", projectId: note.project?._id, note });
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteModal) return;

    const { mode, projectId, note } = noteModal;

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
      <DashboardStats stats={stats} />

      {/* Main work area + calendar */}
      <section className="dash-main-grid">
        <DashboardWorkArea
          projects={projects}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          kanbanColumns={kanbanColumns}
          allTasks={allTasks}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onCreateTask={openCreateTask}
          onEditTask={openEditTask}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
        />

        <DashboardCalendarPanel
          events={calendarEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          tasksForSelectedDate={tasksForSelectedDate}
        />
      </section>

      {/* Projects */}
      <DashboardProjectsSection
        projects={projects}
        tasksByProject={tasksByProject}
        rolesByProject={rolesByProject}
        onAddTask={openCreateTask}
      />

      {/* Notes + Activity */}
      <section className="dash-bottom-grid">
        <DashboardNotesSection
          projects={projects}
          notes={allNotes}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onCreateNote={openCreateNote}
          onEditNote={openEditNote}
          onDeleteNote={handleDeleteNote}
        />

        <DashboardActivitySection items={recentActivity} />
      </section>

      {/* Task modal */}
      <DashboardTaskModal
        modal={taskModal}
        form={taskForm}
        onFormChange={setTaskForm}
        error={taskError}
        saving={taskSaving}
        onClose={() => setTaskModal(null)}
        onSubmit={handleTaskSubmit}
      />

      {/* Note modal */}
      <DashboardNoteModal
        modal={noteModal}
        content={noteContent}
        onContentChange={setNoteContent}
        error={noteError}
        saving={noteSaving}
        onClose={() => setNoteModal(null)}
        onSubmit={handleNoteSubmit}
      />
    </div>
  );
}

export default Dashboard;