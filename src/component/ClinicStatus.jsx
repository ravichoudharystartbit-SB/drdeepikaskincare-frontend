import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/DeepikaNotice.css";
// import "../css/ClinicNotice.css";

const API_URL = import.meta.env.VITE_API_URL;
const CACHE_MS = 60 * 1000;

// Upcoming closures / leaves are shown this many days ahead
const UPCOMING_DAYS = 7;

// Sirf doctor leave par dikhta hai (clinic band ho to nahi dikhta).
// Kuch band ho to enabled: false kar do.
const OPEN_SERVICES = {
  title: "Still available for you",
  medical: {
    enabled: true,
    text: "Medical is open, you can get your medicines",
  },
  procedures: {
    enabled: true,
    text: "Some procedures will be available",
  },
};

// Home and Appointment banners share one fetch if both mount within 60s
let statusCache = { time: 0, data: null };

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

const isDateString = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

// 26 Oct 2026
const formatShortDate = (dateString) => {
  if (!isDateString(dateString)) return "";

  const [year, month, day] = dateString.split("-").map(Number);

  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
};

// Tuesday, 27 October 2026
const formatLongDate = (dateString) => {
  if (!isDateString(dateString)) return "";

  const [year, month, day] = dateString.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return `${WEEKDAYS[weekday]}, ${day} ${MONTHS_LONG[month - 1]} ${year}`;
};

// ---------- leave date helpers ----------

const toDateKey = (value) => {
  if (typeof value !== "string") return "";
  const key = value.slice(0, 10);
  return isDateString(key) ? key : "";
};

const getTodayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
};

const addDaysKey = (dateKey, days) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));

  return next.toISOString().slice(0, 10);
};

const formatRange = (start, end) =>
  end && end !== start
    ? `${formatShortDate(start)} - ${formatShortDate(end)}`
    : formatShortDate(start);

// Reads {start, end, reason} from one closure / leave object, whatever
// field names the API uses.
const readPeriod = (item) => {
  if (!item || typeof item !== "object") return null;

  const start = toDateKey(
    item.startDate || item.fromDate || item.from || item.date
  );
  const end =
    toDateKey(item.endDate || item.toDate || item.to) || start;

  return start ? { start, end, reason: item.reason || "" } : null;
};

// Collects every closure / leave object found in a response: single
// objects and lists under the usual key names.
const collectPeriods = (info, keys) => {
  const found = [];

  keys.forEach((key) => {
    const value = info?.[key];

    if (Array.isArray(value)) found.push(...value);
    else if (value && typeof value === "object") found.push(value);
  });

  return found.map(readPeriod).filter(Boolean);
};

// The leave running today (shown with the doctor).
const pickCurrentLeave = (info) => {
  const today = getTodayKey();
  const periods = collectPeriods(info, [
    "currentLeave",
    "activeLeave",
    "leave",
    "leaves",
    "upcomingLeaves",
    "data",
  ]);

  return (
    periods.find((p) => p.start <= today && today <= p.end) ||
    periods[0] ||
    null
  );
};

// Periods that start after today but within the next few days.
const pickUpcoming = (periods) => {
  const today = getTodayKey();
  const limit = addDaysKey(today, UPCOMING_DAYS);
  const seen = new Set();

  return periods
    .filter((p) => p.start > today && p.start <= limit)
    .filter((p) => {
      const key = `${p.start}|${p.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.start.localeCompare(b.start));
};

const getDoctorLabel = (name) => {
  const cleanName = String(name || "").trim();

  return /^dr(\.|\s)/i.test(cleanName) ? cleanName : `Dr. ${cleanName}`;
};

const unwrap = (json) =>
  json && typeof json === "object" && json.data !== undefined
    ? json.data
    : json;

const fetchJson = async (path, signal) => {
  const response = await fetch(`${API_URL}${path}`, {
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}`);
  }

  return response.json();
};

const loadClinicStatus = async (signal, force = false) => {
  if (
    !force &&
    statusCache.data &&
    Date.now() - statusCache.time < CACHE_MS
  ) {
    return statusCache.data;
  }
  const closureData = unwrap(await fetchJson("/api/clinic-closures", signal)) || {};
  const closure = closureData.currentClosure || null;
  const clinicClosed = Boolean(closureData.closedToday ?? closure);

  // Closures that start in the next few days (not the one running today)
  const upcomingClosures = pickUpcoming(
    collectPeriods(closureData, [
      "upcomingClosures",
      "upcoming",
      "closures",
      "nextClosure",
    ])
  ).map((p) => ({ ...p, type: "closure" }));

  let result;

  if (clinicClosed) {
    result = {
      clinicClosed: true,
      closure,
      reopenDate: closureData.reopenDate || null,
      doctors: [],
      upcoming: upcomingClosures,
    };
  } else {
    const doctorsJson = await fetchJson("/api/doctors", signal);
    const doctorList = Array.isArray(doctorsJson?.data)
      ? doctorsJson.data
      : Array.isArray(doctorsJson)
      ? doctorsJson
      : [];

    const names = doctorList
      .map((doctor) => String(doctor?.name || "").trim())
      .filter(Boolean);

    const leaveResults = await Promise.allSettled(
      names.map((name) =>
        fetchJson(
          `/api/doctor-leaves?doctor=${encodeURIComponent(name)}`,
          signal
        )
      )
    );

    const doctors = [];
    const upcomingLeaves = [];

    // If a doctor's leave status cannot be loaded, that doctor is left out
    // instead of being wrongly shown as available.
    leaveResults.forEach((leaveResult, index) => {
      if (leaveResult.status !== "fulfilled") return;

      const leaveInfo = unwrap(leaveResult.value) || {};

      const onLeave = Boolean(leaveInfo.onLeaveToday);

      doctors.push({
        name: names[index],
        onLeave,
        leave: onLeave ? pickCurrentLeave(leaveInfo) : null,
      });

      pickUpcoming(
        collectPeriods(leaveInfo, [
          "upcomingLeaves",
          "leaves",
          "leave",
          "data",
        ])
      ).forEach((p) =>
        upcomingLeaves.push({ ...p, type: "leave", doctor: names[index] })
      );
    });

    result = {
      clinicClosed: false,
      closure: null,
      reopenDate: null,
      doctors,
      upcoming: [...upcomingClosures, ...upcomingLeaves].sort((a, b) =>
        a.start.localeCompare(b.start)
      ),
    };
  }

  statusCache = { time: Date.now(), data: result };

  return result;
};

// Admin se change hone par page reload kiye bina notice update ho
const REFRESH_MS = 30 * 1000;

const useClinicStatus = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let controller = new AbortController();
    let cancelled = false;

    const refresh = (force) => {
      controller.abort();
      controller = new AbortController();

      loadClinicStatus(controller.signal, force)
        .then((result) => {
          if (!cancelled) setStatus(result);
        })
        .catch((error) => {
          if (error?.name !== "AbortError") {
            console.error("CLINIC STATUS ERROR:", error);
          }
        });
    };

    // pehli baar (cache chalega)
    refresh(false);

    // har 30 second mein fresh data
    const timer = setInterval(() => {
      if (!document.hidden) refresh(true);
    }, REFRESH_MS);

    // tab par wapas aate hi fresh data
    const onVisible = () => {
      if (!document.hidden) refresh(true);
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return status;
};


const FOLD_KEY = "deepika-notice-folded";

const readFolded = () => {
  try {
    return window.sessionStorage.getItem(FOLD_KEY) === "1";
  } catch {
    return false;
  }
};

const saveFolded = (folded) => {
  try {
    window.sessionStorage.setItem(FOLD_KEY, folded ? "1" : "0");
  } catch {
    /* storage not available, ignore */
  }
};

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

const DoctorIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const PillIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.5 20.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7l-10 10z" />
    <path d="M8.5 8.5l7 7" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

// Medical and procedures stay available even when the doctor is away
// or the clinic is closed
const ServicesSection = () => {
  const { title, medical, procedures } = OPEN_SERVICES;

  if (!medical.enabled && !procedures.enabled) return null;

  return (
    <section className="dn-section">
      <h4 className="dn-section-title">{title}</h4>

      <ul className="dn-services">
        {medical.enabled && (
          <li className="dn-service">
            <span className="dn-service-icon"><PillIcon /></span>
            <span>{medical.text}</span>
          </li>
        )}

        {procedures.enabled && (
          <li className="dn-service">
            <span className="dn-service-icon"><PlusIcon /></span>
            <span>{procedures.text}</span>
          </li>
        )}
      </ul>
    </section>
  );
};

// Closures / leaves coming in the next few days
const UpcomingSection = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="dn-section">
      <h4 className="dn-section-title">Coming up</h4>

      <ul className="dn-upcoming">
        {items.map((item) => (
          <li
            className="dn-upcoming-item"
            key={`${item.type}-${item.doctor || ""}-${item.start}-${item.end}`}
          >
            <span className="dn-upcoming-dot" />
            <span>
              <strong>
                {item.type === "closure"
                  ? "Clinic closed"
                  : `${getDoctorLabel(item.doctor)} on leave`}
              </strong>
              <span className="dn-upcoming-date">
                {formatRange(item.start, item.end)}
              </span>
              {item.reason && (
                <span className="dn-upcoming-reason">{item.reason}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const Row = ({ label, children }) => (
  <div className="dn-row">
    <span className="dn-row-label">{label}</span>
    <span className="dn-row-value">{children}</span>
  </div>
);

// Home (variant "side") gets a button; Appointment (variant "card")
// already has the form right below, so it gets a plain sentence.
const NextStep = ({ variant, linkText, hintText }) =>
  variant === "card" ? (
    <p className="dn-hint">{hintText}</p>
  ) : (
    <Link to="/appointment" className="dn-cta">
      {linkText}
    </Link>
  );

const getPanel = (status, variant) => {
  if (status.clinicClosed) {
    const closure = status.closure || {};
    const startDate = closure.startDate || closure.endDate;
    const endDate = closure.endDate || closure.startDate;

    const closedRange =
      startDate && endDate && startDate !== endDate
        ? `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`
        : formatShortDate(startDate);

    return {
      tone: "closed",
      pill: "Clinic is closed",
      icon: <CalendarIcon />,
      title: "Clinic is closed",
      subtitle: "Temporarily unavailable",
      body: (
        <>
          <section className="dn-section">
            {closedRange && <Row label="Closed">{closedRange}</Row>}
            {closure.reason && <Row label="Reason">{closure.reason}</Row>}
            <Row label="Reopens on">
              {status.reopenDate ? (
                <strong>{formatLongDate(status.reopenDate)}</strong>
              ) : (
                "Please check back later"
              )}
            </Row>
          </section>

          <UpcomingSection items={status.upcoming} />
        </>
      ),
      cta: (
        <NextStep
          variant={variant}
          linkText="Book for another date"
          hintText="Please choose another date below to book your appointment."
        />
      ),
    };
  }

  const onLeaveDoctors = status.doctors.filter((d) => d.onLeave);
  const availableDoctors = status.doctors.filter((d) => !d.onLeave);

  // Nothing today, but a closure / leave is coming in the next few days
  if (onLeaveDoctors.length === 0) {
        const upcomingLeaves = (status.upcoming || []).filter(
      (item) => item.type === "leave"
    );
    const upcomingClosures = (status.upcoming || []).filter(
      (item) => item.type === "closure"
    );

    // Doctor leave aane wali hai: aaj jaisa hi layout dikhao
    if (upcomingLeaves.length > 0) {
      return {
        tone: "leave",
        pill: "Doctor update",
        icon: <DoctorIcon />,
        title: "Doctor update",
        subtitle: "Clinic is open today",
        body: (
          <>
            <section className="dn-section">
              {upcomingLeaves.map((item) => (
                <div
                  className="dn-doctor-block"
                  key={`soon-${item.doctor}-${item.start}-${item.end}`}
                >
                  <div className="dn-doctor">
                    <span className="dn-doctor-name">
                      {getDoctorLabel(item.doctor)}
                    </span>
                    <span className="dn-badge dn-badge--leave">
                      Leave soon
                    </span>
                  </div>

                  <div className="dn-leave-info">
                    <Row label="On leave">
                      {formatRange(item.start, item.end)}
                    </Row>

                    {item.reason && (
                      <Row label="Reason">{item.reason}</Row>
                    )}
                  </div>
                </div>
              ))}
            </section>

            <ServicesSection />

            <UpcomingSection items={upcomingClosures} />
          </>
        ),
        cta: (
          <NextStep
            variant={variant}
            linkText="Book an appointment"
            hintText="Please choose your appointment date carefully below."
          />
        ),
      };
    }
    return {
      tone: "upcoming",
      pill: "Upcoming notice",
      icon: <CalendarIcon />,
      title: "Upcoming notice",
      subtitle: "Clinic is open today",
      body: <UpcomingSection items={status.upcoming} />,
      cta: (
        <NextStep
          variant={variant}
          linkText="Book an appointment"
          hintText="Please choose your appointment date carefully below."
        />
      ),
    };
  }

  return {
    tone: "leave",
    pill: "Doctor update",
    icon: <DoctorIcon />,
    title: "Doctor update",
    subtitle: "Clinic is open today",
    body: (
      <>
        <section className="dn-section">
          {onLeaveDoctors.map((doctor) => (
            <div className="dn-doctor-block" key={`leave-${doctor.name}`}>
              <div className="dn-doctor">
                <span className="dn-doctor-name">{getDoctorLabel(doctor.name)}</span>
                <span className="dn-badge dn-badge--leave">Not available</span>
              </div>

              {doctor.leave && (
                <div className="dn-leave-info">
                  <Row label="On leave">
                    {doctor.leave.end && doctor.leave.end !== doctor.leave.start
                      ? `${formatShortDate(doctor.leave.start)} - ${formatShortDate(doctor.leave.end)}`
                      : formatShortDate(doctor.leave.start)}
                  </Row>

                  {doctor.leave.reason && (
                    <Row label="Reason">{doctor.leave.reason}</Row>
                  )}
                </div>
              )}
            </div>
          ))}

          {availableDoctors.map((doctor) => (
            <div className="dn-doctor" key={`avail-${doctor.name}`}>
              <span className="dn-doctor-name">{getDoctorLabel(doctor.name)}</span>
              <span className="dn-badge dn-badge--ok">Available</span>
            </div>
          ))}
        </section>

        <ServicesSection />

        <UpcomingSection items={status.upcoming} />
      </>
    ),
    cta:
      availableDoctors.length > 0 ? (
        <NextStep
          variant={variant}
          linkText="Book with another doctor or date"
          hintText="Please choose another doctor or date below."
        />
      ) : (
        <NextStep
          variant={variant}
          linkText="Book for another date"
          hintText="Please choose another date below to book your appointment."
        />
      ),
  };
};

// ==========================================================
// CLINIC STATUS BANNER
// Renders ONLY when the clinic is closed today, a doctor is on leave
// today, or a closure / leave starts within the next few days.
// Otherwise it renders nothing.
//
// Default (Home page): small box in the top-right corner, right
// under the navbar, kept short so the hero photo stays clear.
// X folds it into a small pill, tap the pill to open it again.
// variant="card": same box above the form (Appointment page).
//
// onClosedChange(true/false) lets a page hide its older in-form
// "clinic closed" notice while this box is showing it.
// ==========================================================

export const ClinicStatusBanner = ({
  variant = "side",
  onClosedChange,
}) => {
  const status = useClinicStatus();
  const [open, setOpen] = useState(() => !readFolded());

  useEffect(() => {
    if (onClosedChange) {
      onClosedChange(Boolean(status?.clinicClosed));
    }
  }, [status, onClosedChange]);

  if (!status) return null;

  const hasDoctorOnLeave = status.doctors.some((doctor) => doctor.onLeave);

  const hasUpcoming = (status.upcoming || []).length > 0;

  if (!status.clinicClosed && !hasDoctorOnLeave && !hasUpcoming) return null;

  const mode = variant === "card" ? "card" : "side";
  const panel = getPanel(status, mode);

  if (mode === "side" && !open) {
    return (
      <button
        type="button"
        className={`dn-pill dn-pill--${panel.tone}`}
        onClick={() => {
          saveFolded(false);
          setOpen(true);
        }}
        aria-label={`${panel.pill}, tap for details`}
      >
        <span className="dn-pill-dot" />
        {panel.pill}
        <span className="dn-pill-more">Details</span>
      </button>
    );
  }

  return (
    <aside
      className={`dn dn--${mode} dn--${panel.tone}`}
      data-deepika-notice="v8"
      role="status"
    >
      <header className="dn-header">
        <span className="dn-icon">{panel.icon}</span>

        <div className="dn-heading">
          <h3 className="dn-title">{panel.title}</h3>
          <p className="dn-subtitle">{panel.subtitle}</p>
        </div>

        {mode === "side" && (
          <button
            type="button"
            className="dn-close"
            onClick={() => {
              saveFolded(true);
              setOpen(false);
            }}
            aria-label="Close notice"
          >
            <CloseIcon />
          </button>
        )}
      </header>

      <div className="dn-body">{panel.body}</div>

      <footer className="dn-footer">{panel.cta}</footer>
    </aside>
  );
};