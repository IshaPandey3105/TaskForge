// Tasks completed per day over the last 7 days, based on real
// updatedAt timestamps of done tasks.

function CompletionTrend({ trend }) {
  const max = Math.max(1, ...trend.map((d) => d.count));

  return (
    <section className="dash-panel trend-panel">
      <div className="dash-panel-head">
        <h2>Completion Trend</h2>
        <span className="dash-panel-hint">last 7 days</span>
      </div>

      <div className="trend-bars">
        {trend.map((day) => (
          <div key={day.key} className="trend-col">
            <span className="trend-count">{day.count > 0 ? day.count : ""}</span>
            <div
              className={`trend-bar${day.count > 0 ? "" : " empty"}`}
              style={{
                height: day.count > 0 ? `${Math.max(8, (day.count / max) * 72)}px` : "4px",
              }}
              title={`${day.count} completed`}
            />
            <span className="trend-label">{day.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CompletionTrend;