import { useEffect, useRef, useState } from "react";

const formatLocalDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const parseLocalDate = (dateString) =>
  dateString ? new Date(`${dateString}T00:00:00`) : new Date();

const AppointmentCalendar = ({
  value,
  onSelect,
  isDateDisabled,
  disabled = false,
  legendText = "",
}) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseLocalDate(value));
  const calendarRef = useRef(null);
  const today = formatLocalDate(new Date());

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!calendarRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const currentMonth = new Date();
  const previousDisabled =
    year < currentMonth.getFullYear() ||
    (year === currentMonth.getFullYear() &&
      month <= currentMonth.getMonth());

  const changeMonth = (offset) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const selectDate = (dateString) => {
    if (isDateDisabled(dateString)) return;
    onSelect(dateString);
    setOpen(false);
  };

  return (
    <div
      className={`skinAppt__calendarField${open ? " is-open" : ""}`}
      ref={calendarRef}
    >
      <button
        className="skinAppt__calendarTrigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!open) {
            setViewDate(parseLocalDate(value));
          }
          setOpen(!open);
        }}
      >
        <span>
          {value
            ? parseLocalDate(value).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "Select date"}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="skinAppt__calendarIcon"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div
          className="skinAppt__calPopover"
          role="dialog"
          aria-label="Choose appointment date"
        >
          <div className="skinAppt__calHeader">
            <button
              type="button"
              className="skinAppt__calNav"
              onClick={() => changeMonth(-1)}
              disabled={previousDisabled}
              aria-label="Previous month"
            >
              ‹
            </button>
            <strong>
              {viewDate.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              type="button"
              className="skinAppt__calNav"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="skinAppt__calGrid" role="grid">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((weekday) => (
              <span
                key={weekday}
                className="skinAppt__calWeekday"
                role="columnheader"
              >
                {weekday}
              </span>
            ))}
            {days.map((day, index) => {
              if (day === null) {
                return (
                  <span
                    key={`empty-${index}`}
                    className="skinAppt__calEmpty"
                    role="gridcell"
                  />
                );
              }

              const dateString = formatLocalDate(
                new Date(year, month, day)
              );
              const dateDisabled = isDateDisabled(dateString);
              const selected = value === dateString;

              return (
                <button
                  key={dateString}
                  type="button"
                  className={[
                    "skinAppt__calDay",
                    dateString === today ? "is-today" : "",
                    selected ? "is-selected" : "",
                    dateDisabled ? "is-disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  role="gridcell"
                  aria-label={new Date(
                    year,
                    month,
                    day
                  ).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  aria-selected={selected}
                  aria-disabled={dateDisabled}
                  tabIndex={0}
                  onClick={() => selectDate(dateString)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {legendText && (
            <p className="skinAppt__calLegend">{legendText}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
