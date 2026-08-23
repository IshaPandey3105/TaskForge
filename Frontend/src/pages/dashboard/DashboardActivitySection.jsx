import formatDate from "../../utils/formatDate";

function DashboardActivitySection({ items }) {
  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <h2>Recent Activity</h2>
      </div>

      {items.length === 0 ? (
        <div className="dash-empty">
          <p>No recent activity yet.</p>
        </div>
      ) : (
        <ul className="activity-list">
          {items.map((item) => (
            <li key={item.id} className="activity-item">
              <span className={`activity-dot ${item.type}`} />
              <div className="activity-body">
                <p>{item.text}</p>
                <span>{formatDate(item.date)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DashboardActivitySection;