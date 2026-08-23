import Calendar from "../../components/dashboard/Calendar";
import formatDate from "../../utils/formatDate";

function DashboardCalendarPanel({
  events,
  selectedDate,
  onSelectDate,
  tasksForSelectedDate,
}) {
  return (
    <aside className="dash-calendar-panel">
      <div className="dash-section-header">
        <h2>Calendar</h2>
      </div>

      <Calendar events={events} onSelectDate={onSelectDate} />

      <div className="dash-calendar-detail">
        <h3>{selectedDate ? formatDate(selectedDate) : "Select a date"}</h3>

        {tasksForSelectedDate.length === 0 ? (
          <p className="dash-empty">
            {selectedDate
              ? "No tasks on this date."
              : "Select a date to see tasks."}
          </p>
        ) : (
          <ul className="dash-date-tasks">
            {tasksForSelectedDate.map((task) => (
              <li key={task._id}>
                <span className={`status-dot ${task.status}`} />
                <span>{task.title}</span>
                <span className="dash-date-task-project">
                  {task.project?.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

export default DashboardCalendarPanel;