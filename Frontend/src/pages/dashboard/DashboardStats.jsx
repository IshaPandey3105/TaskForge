// High-level workspace KPIs. Each metric gets its own accent colour so
// the strip reads as a command center, not a row of identical boxes.

const KPIS = [
  { key: "totalProjects", label: "Projects", icon: "◈", variant: "blue" },
  { key: "totalTasks", label: "Total Tasks", icon: "☑", variant: "violet" },
  { key: "done", label: "Completed", icon: "✓", variant: "emerald" },
  { key: "inProgress", label: "In Progress", icon: "◐", variant: "amber" },
  { key: "todo", label: "Pending / Todo", icon: "○", variant: "slate" },
  { key: "mine", label: "My Tasks", icon: "◎", variant: "cyan" },
];

function DashboardStats({ stats }) {
  return (
    <section className="dash-kpis">
      {KPIS.map((kpi) => (
        <div key={kpi.key} className={`kpi kpi-${kpi.variant}`}>
          <span className="kpi-icon">{kpi.icon}</span>
          <div className="kpi-body">
            <span className="kpi-value">{stats[kpi.key]}</span>
            <span className="kpi-label">{kpi.label}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

export default DashboardStats;