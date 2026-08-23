// Overall workspace completion ring (SVG). Percentage is derived from
// real done/total task counts.

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function OverallCompletion({ pct, done, total }) {
  const offset = CIRCUMFERENCE * (1 - pct / 100);

  return (
    <section className="dash-panel completion-panel">
      <div className="dash-panel-head">
        <h2>Overall Completion</h2>
      </div>

      <div className="ring-wrap">
        <svg viewBox="0 0 140 140" className="ring-svg" role="img">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          <circle
            className="ring-bg"
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            strokeWidth="12"
          />
          <circle
            className="ring-value"
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            stroke="url(#ringGradient)"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
          />
        </svg>

        <div className="ring-center">
          <span className="ring-pct">{pct}%</span>
          <span className="ring-label">complete</span>
        </div>
      </div>

      <p className="ring-legend">
        <b>{done}</b> of <b>{total}</b> tasks completed
      </p>
    </section>
  );
}

export default OverallCompletion;