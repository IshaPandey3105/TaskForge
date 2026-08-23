import { getProjectColor } from "./dashboardTheme";

// Horizontal bar chart: completion percentage for every project,
// computed from real task data (no mock values).

function ProjectProgressChart({ projectStats }) {
  return (
    <section className="dash-panel progress-chart-panel">
      <div className="dash-panel-head">
        <h2>Project Progress</h2>
        <span className="dash-panel-hint">completion %</span>
      </div>

      {projectStats.length === 0 ? (
        <p className="dash-empty-mini">Nothing to chart yet.</p>
      ) : (
        <div className="pp-chart">
          {projectStats.map((ps, index) => {
            const color = getProjectColor(index);

            return (
              <div key={ps.project._id} className="pp-row">
                <span className="pp-name" title={ps.project.name}>
                  {ps.project.name}
                </span>

                <div className="pp-track">
                  <div
                    className="pp-fill"
                    style={{
                      width: `${ps.pct}%`,
                      background: `linear-gradient(90deg, ${color.base}99, ${color.base})`,
                    }}
                  />
                </div>

                <span className="pp-pct">{ps.pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ProjectProgressChart;