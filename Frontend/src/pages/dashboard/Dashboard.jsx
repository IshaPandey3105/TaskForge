import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import "../../layoutes/Dashboard.css";

import DashboardStats from "./DashboardStats";
import QuickActions from "./QuickActions";
import ProjectStatusCards from "./ProjectStatusCards";
import ProjectProgressChart from "./ProjectProgressChart";
import OverallCompletion from "./OverallCompletion";
import CompletionTrend from "./CompletionTrend";
import MyWorkPanel from "./MyWorkPanel";
import RecentActivityPanel from "./RecentActivityPanel";
import RecentProjectsPanel from "./RecentProjectsPanel";

function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const [projects, setProjects] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});
  const [rolesByProject, setRolesByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch projects the user is a member of
      const projectsRes = await api.get("/projects");
      const projectList = projectsRes.data.data || [];

      setProjects(projectList);

      // 2. Fetch tasks for each project
      const taskPromises = projectList.map(async (project) => {
        try {
          const res = await api.get(`/tasks/${project._id}`);
          return { projectId: project._id, tasks: res.data.data || [] };
        } catch {
          return { projectId: project._id, tasks: [] };
        }
      });

      // 3. Fetch each project's members to find the current user's role
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

      const [taskResults, roleResults] = await Promise.all([
        Promise.all(taskPromises),
        Promise.all(rolePromises),
      ]);

      const tasksMap = {};
      taskResults.forEach((r) => {
        tasksMap[r.projectId] = r.tasks;
      });

      const rolesMap = {};
      roleResults.forEach((r) => {
        rolesMap[r.projectId] = r.role;
      });

      setTasksByProject(tasksMap);
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

  // ---- Derived workspace insights (all real API data) ----

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

  const stats = useMemo(() => {
    return {
      totalProjects: projects.length,
      totalTasks: allTasks.length,
      done: allTasks.filter((t) => t.status === "done").length,
      inProgress: allTasks.filter((t) => t.status === "in-progress").length,
      todo: allTasks.filter((t) => t.status === "todo").length,
      mine: allTasks.filter((t) => t.assignedTo?._id === user?._id).length,
    };
  }, [projects, allTasks, user?._id]);

  const overallPct = useMemo(() => {
    if (stats.totalTasks === 0) return 0;
    return Math.round((stats.done / stats.totalTasks) * 100);
  }, [stats]);

  // Per-project progress used by the cards and the chart
  const projectStats = useMemo(() => {
    return projects.map((project) => {
      const tasks = tasksByProject[project._id] || [];
      const done = tasks.filter((t) => t.status === "done").length;
      const inProgress = tasks.filter((t) => t.status === "in-progress").length;
      const todo = tasks.filter((t) => t.status === "todo").length;

      return {
        project,
        total: tasks.length,
        done,
        inProgress,
        todo,
        pct: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100),
        updatedAt: project.updatedAt || project.createdAt,
      };
    });
  }, [projects, tasksByProject]);

  // Completion trend: tasks marked done per day over the last 7 days,
  // based on each task's real updatedAt timestamp.
  const trend = useMemo(() => {
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i
      );
      const next = new Date(day.getTime() + 86400000);

      const count = allTasks.filter((t) => {
        if (t.status !== "done" || !t.updatedAt) return false;
        const d = new Date(t.updatedAt);
        return d >= day && d < next;
      }).length;

      days.push({
        key: day.toISOString(),
        label: day.toLocaleDateString(undefined, { weekday: "short" }),
        count,
      });
    }

    return days;
  }, [allTasks]);

  const myWork = useMemo(() => {
    return allTasks
      .filter((t) => t.assignedTo?._id === user?._id)
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      )
      .slice(0, 6);
  }, [allTasks, user?._id]);

  const recentTasks = useMemo(() => {
    return [...allTasks]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      )
      .slice(0, 6);
  }, [allTasks]);

  const recentProjects = useMemo(() => {
    return [...projectStats]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
  }, [projectStats]);

  const firstName = user?.fullName?.split(" ")[0] || "there";

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
      {/* Hero */}
      <section className="dash-hero">
        <div className="dash-hero-text">
          <h1>Welcome back, {firstName}</h1>
          <p>
            Here is how your workspace is performing today
            {user?.role ? (
              <>
                {" "}
                — signed in as <strong>{user.role}</strong>
              </>
            ) : null}
            .
          </p>
        </div>

        <QuickActions />
      </section>

      {/* KPI overview */}
      <DashboardStats stats={stats} />

      {/* Progress command center */}
      <section className="dash-main-grid">
        <div className="dash-col">
          <ProjectStatusCards projectStats={projectStats} />
        </div>

        <div className="dash-col">
          <ProjectProgressChart projectStats={projectStats} />
          <OverallCompletion pct={overallPct} done={stats.done} total={stats.totalTasks} />
          <CompletionTrend trend={trend} />
        </div>
      </section>

      {/* Workspace insights */}
      <section className="dash-bottom-grid">
        <MyWorkPanel tasks={myWork} />
        <RecentActivityPanel tasks={recentTasks} />
        <RecentProjectsPanel projects={recentProjects} />
      </section>
    </div>
  );
}

export default Dashboard;