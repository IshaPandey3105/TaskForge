import { useNavigate } from "react-router-dom";
import { getProjectColor } from "./dashboardTheme";

// Colourful compact overview card per project — visually distinct from the
// generic cards used elsewhere via accent borders, tinted percentage chips
// and an inline progress track.

function ProjectStatusCards({ projectStats }) {
  const navigate = useNavigate();

  return (
    <section className="dash-panel project-cards-panel">
      <div className="dash-panel-head">
        <h2>Project Overview</h2>
        <span className="dash-panel-hint">
          {projectStats.length} project{projectStats.length === 1 ? "" : "s"}
        </span>
      </div>

      {projectStats.length === 0 ? (
        <p className="dash-empty-mini">
          No projects yet. Create one to start tracking progress.
        </p>
      ) : (
        <div className="project-status-cards">
          {projectStats.map((ps, index) => {
            const color = getProjectColor(index);

            return (
              <button
                key={ps.project._id}
                type="button"
                className="ps-card"
                style={{ "--pc": color.base, "--pcs": color.soft }}
                onClick={() => navigate(`/projects/${ps.project._id}`)}
                title={`Open ${ps.project.name}`}
              >
                <div className="ps-head">
                  <span className="ps-name">{ps.project.name}</span>
                  <span className="ps-pct">{ps.pct}%</span>
                </div>

                <div className="ps-counts">
                  <span className="ps-count done">
                    <b>{ps.done}</b> done
                  </span>
                  <span className="ps-count in-progress">
                    <b>{ps.inProgress}</b> active
                  </span>
                  <span className="ps-count todo">
                    <b>{ps.todo}</b> todo
                  </span>
                  <span className="ps-count total">
                    <b>{ps.total}</b> total
                  </span>
                </div>

                <div className="ps-track">
                  <div
                    className="ps-fill"
                    style={{ width: `${ps.pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ProjectStatusCards;