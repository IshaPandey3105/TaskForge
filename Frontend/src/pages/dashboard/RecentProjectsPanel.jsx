import { useNavigate } from "react-router-dom";
import formatDate from "../../utils/formatDate";
import { getProjectColor } from "./dashboardTheme";

// Recently updated projects with their live completion percentage.

function RecentProjectsPanel({ projects }) {
  const navigate = useNavigate();

  return (
    <section className="dash-panel insight-panel">
      <div className="dash-panel-head">
        <h2>Recently Updated</h2>
        <button
          type="button"
          className="dash-panel-link"
          onClick={() => navigate("/projects")}
        >
          All Projects →
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="dash-empty-mini">No projects yet.</p>
      ) : (
        <ul className="dash-row-list">
          {projects.map((ps, index) => {
            const color = getProjectColor(
              // Keep the same colour the project has elsewhere on the page
              projects.indexOf(ps)
            );

            return (
              <li
                key={ps.project._id}
                className="dash-row clickable"
                onClick={() => navigate(`/projects/${ps.project._id}`)}
              >
                <span
                  className="rp-dot"
                  style={{ background: color.base }}
                />
                <div className="dash-row-body">
                  <span className="dash-row-title">{ps.project.name}</span>
                  <span className="dash-row-sub">
                    Updated {formatDate(ps.updatedAt)}
                  </span>
                </div>
                <span className="rp-pct" style={{ color: color.base }}>
                  {ps.pct}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default RecentProjectsPanel;