import { useNavigate } from "react-router-dom";

// Navigation-only quick actions — no CRUD duplication of feature pages.

const ACTIONS = [
  { label: "+ New Task", path: "/tasks", variant: "primary" },
  { label: "Projects", path: "/projects" },
  { label: "Write Note", path: "/notes" },
  { label: "Activity", path: "/activity" },
];

function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="dash-quick-actions">
      {ACTIONS.map((action) => (
        <button
          key={action.path}
          type="button"
          className={`qa-btn${action.variant === "primary" ? " primary" : ""}`}
          onClick={() => navigate(action.path)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

export default QuickActions;