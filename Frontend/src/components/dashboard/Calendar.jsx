import { useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getMonthMatrix(year, month) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];

  // Leading blanks
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }

  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }

  // Pad to full weeks (rows of 7)
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function Calendar({ events = [], onSelectDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const cells = getMonthMatrix(viewYear, viewMonth);

  const handlePrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelect = (day) => {
    if (!day) return;
    const date = new Date(viewYear, viewMonth, day);
    setSelectedDate(date);
    if (onSelectDate) {
      onSelectDate(date);
    }
  };

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      viewMonth === today.getMonth() &&
      viewYear === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      selectedDate &&
      day === selectedDate.getDate() &&
      viewMonth === selectedDate.getMonth() &&
      viewYear === selectedDate.getFullYear()
    );
  };

  const hasEvent = (day) => {
    if (!day) return false;
    return events.some((event) => {
      const d = new Date(event.date);
      return (
        d.getDate() === day &&
        d.getMonth() === viewMonth &&
        d.getFullYear() === viewYear
      );
    });
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav"
          onClick={handlePrev}
          aria-label="Previous month"
        >
          ‹
        </button>

        <span className="calendar-title">
          {MONTHS[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          className="calendar-nav"
          onClick={handleNext}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day} className="calendar-weekday">
            {day}
          </span>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((day, index) => (
          <button
            key={index}
            type="button"
            className={`calendar-day${day ? "" : " empty"}${
              isToday(day) ? " today" : ""
            }${isSelected(day) ? " selected" : ""}${
              hasEvent(day) ? " has-event" : ""
            }`}
            onClick={() => handleSelect(day)}
            disabled={!day}
          >
            {day || ""}
            {hasEvent(day) && <span className="calendar-dot" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Calendar;