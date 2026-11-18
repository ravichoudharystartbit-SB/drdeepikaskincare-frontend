import "../css/Admindashboard.css";
import "../css/PatientDiary.css";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { generateTimeSlots } from "../utils/timeSlots";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const formatTime = (time) => {
  if (!time) return "-";

  const [hours, minutes] = time.split(":");

  const date = new Date();
  date.setHours(Number(hours));
  date.setMinutes(Number(minutes));

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getConsultationMode = (type) => {
  if (type === "video") return "VIDEO";
  if (type === "clinic") return "CLINIC";
  if (type === "procedure") return "PROCEDURE";
  return "-";
};

const createDefaultSchedule = () => {
  const data = {};

  days.forEach((day) => {
    data[day] = {
      enabled: day !== "Sunday",

      sessions: [
        {
          startTime: "10:30",
          endTime: "14:00",
        },
        {
          startTime: "16:00",
          endTime: "19:30",
        },
      ],

      // Old fields kept for compatibility
      startTime: "10:30",
      endTime: "19:30",
    };
  });

  return data;
};

const getDayNameFromDate = (dateString) => {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
  });
};




const normalizeTime = (time) =>
  typeof time === "string" ? time.slice(0, 5) : "";

const isPastSlot = (dateString, timeString) => {
  if (!dateString || !timeString) return false;

  const now = new Date();

  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = normalizeTime(timeString)
    .split(":")
    .map(Number);

  const slotDateTime = new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    0,
    0
  );

  return slotDateTime <= now;
};

/* =========================================================
   APPOINTMENT UNIQUE KEY
   ========================================================= */
const getAppointmentUniqueKey = (appointment) => {
  if (!appointment) return "";

  return String(
    appointment?._id ||
      appointment?.appointmentNumber ||
      appointment?.id ||
      `${appointment?.name || ""}-${appointment?.phone || ""}-${
        appointment?.appointment_date ||
        appointment?.date ||
        ""
      }-${appointment?.appointment_time || appointment?.time || ""}-${
        appointment?.createdAt || ""
      }`
  );
};
const sameDoctor = (a, b) =>
  String(a || "").trim().toLowerCase() ===
  String(b || "").trim().toLowerCase();

const findLeave = (leaves, doctor, date) =>
  leaves.find(
    (l) =>
      sameDoctor(l.doctor, doctor) &&
      l.startDate <= date &&
      l.endDate >= date
  ) || null;

const findClosure = (closures, date) =>
  closures.find((c) => c.startDate <= date && c.endDate >= date) || null;
const serviceCategories = [
  "Hair",
  "Skin",
  "Laser",
  "RF",
  "Diagnosis",
  "Surgery",
  "Other",
];

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [contacts, setContacts] = useState([]);

  // ==========================================
  // NOTIFICATION TRACKING
  // ==========================================
  const appointmentIdsRef = useRef(new Set());
  const appointmentsInitializedRef = useRef(false);

  const contactIdsRef = useRef(new Set());
  const contactsInitializedRef = useRef(false);

  // One notification at a time
  const notificationQueueRef = useRef(Promise.resolve());

  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);

  const [showSchedule, setShowSchedule] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
const offlineHoldCreationLockRef = useRef(false);
  // ==========================================
// PATIENT DIARY
// ==========================================
const [showPatientDiary, setShowPatientDiary] = useState(false);

const [diaryEntries, setDiaryEntries] = useState([]);
const [diaryLoading, setDiaryLoading] = useState(false);

const [diarySearch, setDiarySearch] = useState("");
const [diaryMobileSearch, setDiaryMobileSearch] = useState("");
const [diaryTreatmentFilter, setDiaryTreatmentFilter] = useState("");
const [diaryStatusFilter, setDiaryStatusFilter] = useState("");

const [diaryMonth, setDiaryMonth] = useState(
  new Date()
);
const [diarySelectedDate, setDiarySelectedDate] = useState("");

const [showDiaryModal, setShowDiaryModal] = useState(false);

// IGNORE FOLLOW-UP
const [showIgnoreModal, setShowIgnoreModal] = useState(false);
const [ignoreEntry, setIgnoreEntry] = useState(null);
const [ignoreReason, setIgnoreReason] = useState("");
const [ignoreSaving, setIgnoreSaving] = useState(false);
const [editingDiaryId, setEditingDiaryId] = useState(null);

const [diaryForm, setDiaryForm] = useState({
  patientName: "",
  phone: "",
  doctor: "",
  treatment: "",
  previousVisitDate: new Date().toISOString().split("T")[0],
  followUpDate: "",
  notes: "",
  remarks: "",
});

  // SLOT MANAGEMENT
  const [showSlotManagement, setShowSlotManagement] = useState(false);
  const [slotDate, setSlotDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const slotDateRef = useRef(slotDate);
  slotDateRef.current = slotDate;
  const [offlineSlots, setOfflineSlots] = useState([]);
  const [slotHolds, setSlotHolds] = useState([]);
const offlineHoldRef = useRef(null);
const offlineBookingLockRef = useRef(false);
  const [slotSchedule, setSlotSchedule] = useState(
    createDefaultSchedule()
  );
  const [slotScheduleLoading, setSlotScheduleLoading] = useState(false);
  const [offlineSlotLoading, setOfflineSlotLoading] = useState(false);
  const [offlineSlotAction, setOfflineSlotAction] = useState("");
  const [slotDoctor, setSlotDoctor] = useState("");
const slotDoctorRef = useRef(slotDoctor);
slotDoctorRef.current = slotDoctor;
const [allLeaves, setAllLeaves] = useState([]);
const [allClosures, setAllClosures] = useState([]);

const loadAvailabilityBlocks = async () => {
  try {
    const authHeaders = {
      Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
    };
    const base = import.meta.env.VITE_API_URL;

    const [leaveRes, closureRes] = await Promise.all([
      fetch(`${base}/api/admin/doctor-leaves`, {
        headers: authHeaders,
        cache: "no-store",
      }),
      fetch(`${base}/api/admin/clinic-closures`, {
        headers: authHeaders,
        cache: "no-store",
      }),
    ]);

    const leaveData = await leaveRes.json();
    const closureData = await closureRes.json();

    if (leaveRes.ok) {
      setAllLeaves(Array.isArray(leaveData.data) ? leaveData.data : []);
    }

    if (closureRes.ok) {
      setAllClosures(
        Array.isArray(closureData.data?.closures)
          ? closureData.data.closures
          : []
      );
    }
  } catch (error) {
    console.error("LOAD AVAILABILITY ERROR:", error);
  }
};
  const [offlineInfoModal, setOfflineInfoModal] = useState(false);
const [offlineInfoName, setOfflineInfoName] = useState("");
const [offlineInfoPhone, setOfflineInfoPhone] = useState("");
const [offlineInfoSlot, setOfflineInfoSlot] = useState(null);
const [offlineInfoEditing, setOfflineInfoEditing] = useState(false);

  const [showDoctors, setShowDoctors] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorSaving, setDoctorSaving] = useState(false);
const offlineHoldReleaseLockRef = useRef(false);
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    specialization: "",
  });

  const [showAdminProfile, setShowAdminProfile] = useState(false);

  const [showServices, setShowServices] = useState(false);

  const [services, setServices] = useState([]);
  const [editingServiceId, setEditingServiceId] = useState(null);

  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "",
    description: "",
    amount: "",
    gstIncluded: "",
    image: null,
  });

const [sendingReminderId, setSendingReminderId] = useState(null);
const [reminderSentId, setReminderSentId] = useState(null);
const reminderTimeoutRef = useRef(null);


  const [serviceImagePreview, setServiceImagePreview] = useState("");
  const [serviceSaving, setServiceSaving] = useState(false);

  const [showYoutube, setShowYoutube] = useState(false);

  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeSaving, setYoutubeSaving] = useState(false);
  const [editingYoutubeId, setEditingYoutubeId] = useState(null);


  const [selectedProfileImage, setSelectedProfileImage] = useState(null);

  const [youtubeForm, setYoutubeForm] = useState({
    title: "",
    category: "",
    link: "",
    thumbnail: null,
  });

  const [youtubeThumbnailPreview, setYoutubeThumbnailPreview] =
    useState("");

  const [showPassword, setShowPassword] = useState(false);

  const token = localStorage.getItem("adminToken");

  const admin = JSON.parse(localStorage.getItem("admin") || "{}");

  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const [rescheduleSchedule, setRescheduleSchedule] = useState(
    createDefaultSchedule()
  );

  const [bookedTimes, setBookedTimes] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  const [showWelcome, setShowWelcome] = useState(true);
const [selectedAppointmentDate, setSelectedAppointmentDate] = useState(
  new Date().toISOString().split("T")[0]
);

const [showAllAppointments, setShowAllAppointments] = useState(false);
const [showAttendedView, setShowAttendedView] = useState(false);

const filteredAppointments = appointments.filter((appointment) => {
  if (showAttendedView) {
    return appointment.attended === true;
  }

  if (appointment.attended === true) {
    return false;
  }

  if (showAllAppointments) {
    return true;
  }

  return appointment.appointment_date === selectedAppointmentDate;
});

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const [showConsultationFees, setShowConsultationFees] =
  useState(false);

const [consultationFees, setConsultationFees] = useState({
  clinicFee: 200,
  videoFee: 500,
  procedureFee: 500,
});

const [indianHolidays, setIndianHolidays] = useState([]);
const holidayYearsLoadedRef = useRef(new Set());

const holidayByDate = indianHolidays.reduce((accumulator, item) => {
  const dateKey = item?.start?.date || item?.date || "";

  if (dateKey) {
    if (!accumulator[dateKey]) {
      accumulator[dateKey] = [];
    }

    accumulator[dateKey].push(item);
  }

  return accumulator;
}, {});

const fetchHolidaysForYear = async (year) => {
  if (holidayYearsLoadedRef.current.has(year)) {
    return;
  }

  const calendarKey =
    import.meta.env.VITE_GOOGLE_CALENDAR_KEY ||
    "AIzaSyDcYoYSVh8Q35Fj0BxVEo8e-ZH6k0dj2fw";

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/en.indian%23holiday%40group.v.calendar.google.com/events?key=${calendarKey}&timeMin=${year}-01-01T00:00:00Z&timeMax=${year + 1}-01-01T00:00:00Z&singleEvents=true&orderBy=startTime&maxResults=500`
    );

    if (!response.ok) {
      throw new Error("Holiday fetch failed");
    }

    const data = await response.json();
    const nextItems = Array.isArray(data.items) ? data.items : [];

    setIndianHolidays((previous) => {
      const merged = [...previous, ...nextItems];
      const deduped = new Map();

      merged.forEach((item) => {
        if (item?.id) {
          deduped.set(item.id, item);
        }
      });

      return Array.from(deduped.values());
    });

    holidayYearsLoadedRef.current.add(year);
  } catch (error) {
    console.error("Holiday error:", error);
    holidayYearsLoadedRef.current.delete(year);
  }
};

useEffect(() => {
  const year = diaryMonth.getFullYear();
  const nextYear = year + 1;

  if (!holidayYearsLoadedRef.current.has(year)) {
    fetchHolidaysForYear(year);
  }

  if (!holidayYearsLoadedRef.current.has(nextYear)) {
    fetchHolidaysForYear(nextYear);
  }
}, [diaryMonth]);


const [feeLoading, setFeeLoading] = useState(false);
const [feeSaving, setFeeSaving] = useState(false);

  const queueNotification = (content, options = {}) => {
    notificationQueueRef.current =
      notificationQueueRef.current.then(
        () =>
          new Promise((resolve) => {
            toast(content, {
              ...options,
              autoClose: 5000,
              onClose: resolve,
            });
          })
      );
  };

  // =========================================================
  // SLOT MANAGEMENT
  // =========================================================
  const getSlotSchedule = async () => {
    try {
      setSlotScheduleLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/schedule`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(data.message || "Unable to load clinic schedule");
        return;
      }

      setSlotSchedule(data.schedule || createDefaultSchedule());
    } catch (error) {
      console.error("GET SLOT SCHEDULE ERROR:", error);
      toast.error("Unable to load clinic schedule");
    } finally {
      setSlotScheduleLoading(false);
    }
  };

  const getOfflineSlots = async (date) => {
    if (!date) {
      setOfflineSlots([]);
      return;
    }

    try {
      setOfflineSlotLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments/admin/offline-slots?date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(data.message || "Unable to load offline slots");
        setOfflineSlots([]);
        return;
      }

      setOfflineSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch (error) {
      console.error("GET OFFLINE SLOTS ERROR:", error);
      setOfflineSlots([]);
    } finally {
      setOfflineSlotLoading(false);
    }
  };
const getSlotHolds = async (date, doctor = slotDoctor) => {
  try {
    const doctorQuery = doctor
      ? `&doctor=${encodeURIComponent(doctor)}`
      : "";

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/appointments/admin/slot-holds?date=${date}${doctorQuery}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(data.message || "Unable to load slot holds");
      return;
    }

    setSlotHolds(data.holds || []);
  } catch (error) {
    console.error("GET SLOT HOLDS ERROR:", error);
  }
};
  const openSlotManagement = async () => {
  setShowSlotManagement(true);
  setShowContacts(false);
  setShowDoctors(false);
  setShowServices(false);
  setShowYoutube(false);
  setShowConsultationFees(false);
  setShowPatientDiary(false);

  const doctorName = slotDoctor || doctors[0]?.name || "";

  if (!slotDoctor && doctorName) {
    setSlotDoctor(doctorName);
  }
  await loadAvailabilityBlocks();
  await getSlotSchedule();
  await Promise.all([
    getOfflineSlots(slotDate),
    getSlotHolds(slotDate, doctorName),
  ]);
};


const handleSlotDateChange = async (e) => {
  const date = e.target.value;

  if (
    offlineHoldRef.current ||
    offlineHoldCreationLockRef.current ||
    offlineHoldReleaseLockRef.current ||
    offlineBookingLockRef.current
  ) {
    toast.error("Please finish the current offline booking first");
    return;
  }

  setSlotDate(date);
  if (!date) return;

  await Promise.all([
    getOfflineSlots(date),
    getSlotHolds(date, slotDoctor),
  ]);
};

const createOfflineHold = async (slot) => {
  if (offlineHoldCreationLockRef.current) return; 
  const time = slot.value;
  const doctorName = slotDoctor || doctors[0]?.name || "";

  if (isPastSlot(slotDate, time)) {
    toast.error("This time slot has already passed");
    return;
  }

  if (!doctorName) {
    toast.error("Please select a doctor first");
    return;
  }
if (
  offlineHoldReleaseLockRef.current ||
  offlineBookingLockRef.current
) {
  toast.error("Please finish the current offline booking first");
  return;
}
  if (offlineHoldRef.current) {
    toast.error("Please finish the current offline booking first");
    return;
  }

  try {
      offlineHoldCreationLockRef.current = true;
    setOfflineSlotAction(`book-${time}`);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/appointments/admin/offline-holds`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: slotDate,
          time,
          doctor: doctorName,
        }),
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(data.message || "This slot is not available");
      await getSlotHolds(slotDate, doctorName);
      return;
    }

    offlineHoldRef.current = {
      holdId: data.holdId,
      holdToken: data.holdToken,
      date: slotDate,
      time,
      doctor: doctorName,
    };

    setOfflineInfoSlot(slot);
    setOfflineInfoName("");
    setOfflineInfoPhone("");
    setOfflineInfoEditing(false);

    await getSlotHolds(slotDate, doctorName);

    setOfflineInfoModal(true);
  } catch (error) {
    console.error("CREATE OFFLINE HOLD ERROR:", error);
    toast.error("Unable to hold this slot");
  } finally {
  offlineHoldCreationLockRef.current = false;
  setOfflineSlotAction("");
}
};

const bookOfflineSlot = async (time) => {
if (
  offlineBookingLockRef.current ||
  offlineHoldCreationLockRef.current ||
  offlineHoldReleaseLockRef.current ||
  offlineSlotAction.startsWith("book-")
) return;
  if (isPastSlot(slotDate, time)) {
    toast.error("This time slot has already passed");
    return;
  }

  const doctorName = slotDoctor || doctors[0]?.name || "";
  const hold = offlineHoldRef.current;
if (offlineInfoPhone.trim() && !/^\d{10}$/.test(offlineInfoPhone.trim())) {
  toast.error("Mobile number must be 10 digits");
  return;
}
  if (!doctorName) {
    toast.error("Please select a doctor first");
    return;
  }

  if (
    !hold ||
    hold.time !== time ||
    hold.date !== slotDate ||
    hold.doctor !== doctorName
  ) {
    toast.error("Slot hold expired or missing. Please select the slot again.");
    return;
  }

  try {
    offlineBookingLockRef.current = true;
    setOfflineSlotAction(`book-${time}`);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/appointments/admin/offline-slots`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: slotDate,
          time,
          doctor: doctorName,
          patientName: offlineInfoName.trim(),
          patientPhone: offlineInfoPhone.trim(),
          holdId: hold.holdId,
          holdToken: hold.holdToken,
        }),
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(data.message || "Unable to book offline slot");
      return;
    }

    offlineHoldRef.current = null;

    toast.success("Offline slot booked successfully");

    setOfflineInfoModal(false);
    setOfflineInfoSlot(null);

    await Promise.all([
      getOfflineSlots(slotDate),
      getSlotHolds(slotDate, doctorName),
    ]);
  } catch (error) {
    console.error("BOOK OFFLINE SLOT ERROR:", error);
    toast.error("Server error");
  } finally {
  offlineBookingLockRef.current = false;
  setOfflineSlotAction("");
}
};
  const releaseOfflineSlot = async (slotId) => {
    if (
  offlineHoldRef.current ||
  offlineHoldCreationLockRef.current ||
  offlineHoldReleaseLockRef.current ||
  offlineBookingLockRef.current
) {
  toast.error("Please finish the current offline booking first");
  return;
}

offlineHoldReleaseLockRef.current = true;
    try {
      setOfflineSlotAction(`release-${slotId}`);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments/admin/offline-slots/${slotId}/release`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(data.message || "Unable to release offline slot");
        return;
      }

      toast.success("Offline slot released successfully");
    await Promise.all([
  getOfflineSlots(slotDate),
  getSlotHolds(slotDate, slotDoctor),
]);
    } catch (error) {
      console.error("RELEASE OFFLINE SLOT ERROR:", error);
      toast.error("Server error");
    } finally {
  offlineHoldReleaseLockRef.current = false;
  setOfflineSlotAction("");
}
  };
const closeOfflineInfoModal = async () => {
if (
  offlineBookingLockRef.current ||
  offlineHoldCreationLockRef.current ||
  offlineHoldReleaseLockRef.current ||
  offlineSlotAction.startsWith("book-")
) return;
  const hold = offlineHoldRef.current;



  if (hold) {
    if (offlineHoldReleaseLockRef.current) return;
    try {
      offlineHoldReleaseLockRef.current = true;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments/admin/offline-holds/release`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            holdId: hold.holdId,
            holdToken: hold.holdToken,
          }),
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error("Unable to release slot hold. Please try again.");
        return;
      }

      offlineHoldRef.current = null;

      await getSlotHolds(hold.date, hold.doctor);
    } catch (error) {
      console.error("RELEASE OFFLINE HOLD ERROR:", error);
      toast.error("Unable to release slot hold");
      return;
    }finally {
  offlineHoldReleaseLockRef.current = false;
}
  }

  setOfflineInfoModal(false);
  setOfflineInfoSlot(null);
  setOfflineInfoName("");
  setOfflineInfoPhone("");
  setOfflineInfoEditing(false);
};
const updateOfflineSlotInfo = async (slotId) => {
  if (
  offlineHoldRef.current ||
  offlineHoldCreationLockRef.current ||
  offlineHoldReleaseLockRef.current ||
  offlineBookingLockRef.current
) {
  toast.error("Please finish the current offline booking first");
  return;
}
  try {
    setOfflineSlotAction(`edit-${slotId}`);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/appointments/admin/offline-slots/${slotId}/info`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientName: offlineInfoName.trim(),
          patientPhone: offlineInfoPhone.trim(),
        }),
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(data.message || "Unable to update patient information");
      return;
    }

    toast.success("Patient information updated successfully");

    setOfflineInfoModal(false);
    setOfflineInfoSlot(null);
    setOfflineInfoName("");
    setOfflineInfoPhone("");
    setOfflineInfoEditing(false);

    await getOfflineSlots(slotDate);
  } catch (error) {
    console.error("UPDATE OFFLINE SLOT INFO ERROR:", error);
    toast.error("Server error");
  } finally {
    setOfflineSlotAction("");
  }
};


  const getServices = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/services`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();


      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(data.message || "Unable to fetch services");
        setServices([]);
        return;
      }

      setServices(
        Array.isArray(data)
          ? data
          : Array.isArray(data.services)
          ? data.services
          : []
      );
    } catch (error) {
      console.error("GET SERVICES ERROR:", error);
      setServices([]);
    }
  };

  const getYoutubeVideos = async () => {
    try {
      setYoutubeLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/youtube`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(data.message || "Unable to fetch YouTube videos");
        setYoutubeVideos([]);
        return;
      }

      setYoutubeVideos(
        Array.isArray(data)
          ? data
          : Array.isArray(data.videos)
          ? data.videos
          : []
      );
    } catch (error) {
      console.error("GET YOUTUBE VIDEOS ERROR:", error);
      setYoutubeVideos([]);
    } finally {
      setYoutubeLoading(false);
    }
  };


  // =========================================================
// PATIENT DIARY - GET
// =========================================================

const getDiaryEntries = async () => {
  try {
    setDiaryLoading(true);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/patient-diary/admin`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(
        data.message || "Unable to fetch patient diary"
      );
      return;
    }

    setDiaryEntries(
      Array.isArray(data.entries)
        ? data.entries
        : []
    );
  } catch (error) {
    console.error("GET PATIENT DIARY ERROR:", error);
    toast.error("Unable to load patient diary");
  } finally {
    setDiaryLoading(false);
  }
};


// =========================================================
// PATIENT DIARY - RESET FORM
// =========================================================

const resetDiaryForm = () => {
  setDiaryForm({
    patientName: "",
    phone: "",
    doctor: "",
    treatment: "",
    previousVisitDate:
      new Date().toISOString().split("T")[0],
    followUpDate: "",
    notes: "",
    remarks: "",
  });

  setEditingDiaryId(null);
};


// =========================================================
// PATIENT DIARY - QUICK DATE
// =========================================================

const setDiaryQuickDate = (type) => {
  const baseDate = diaryForm.previousVisitDate
    ? new Date(`${diaryForm.previousVisitDate}T00:00:00`)
    : new Date();

  const nextDate = new Date(baseDate);

  if (type === "7") {
    nextDate.setDate(nextDate.getDate() + 7);
  }

  if (type === "15") {
    nextDate.setDate(nextDate.getDate() + 15);
  }

  if (type === "1month") {
    const day = nextDate.getDate();
    nextDate.setDate(1);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const lastDay = new Date(
      nextDate.getFullYear(),
      nextDate.getMonth() + 1,
      0
    ).getDate();
    nextDate.setDate(Math.min(day, lastDay));
  }

  const formattedDate =
    `${nextDate.getFullYear()}-${String(
      nextDate.getMonth() + 1
    ).padStart(2, "0")}-${String(
      nextDate.getDate()
    ).padStart(2, "0")}`;

  setDiaryForm((prev) => ({
    ...prev,
    followUpDate: formattedDate,
  }));
};


// =========================================================
// PATIENT DIARY - SAVE
// =========================================================

const saveDiaryEntry = async (e) => {
  e.preventDefault();

  if (
    !diaryForm.patientName.trim() ||
    !diaryForm.phone.trim() ||
    !diaryForm.followUpDate
  ) {
    toast.error(
      "Patient name, phone and follow-up date are required"
    );
    return;
  }

  if (!/^\d{10}$/.test(diaryForm.phone.trim())) {
    toast.error("Please enter a valid 10-digit phone number");
    return;
  }

  if (!diaryForm.previousVisitDate) {
    toast.error("Previous visit date is required");
    return;
  }

  try {
    const url = editingDiaryId
      ? `${import.meta.env.VITE_API_URL}/api/patient-diary/admin/${editingDiaryId}`
      : `${import.meta.env.VITE_API_URL}/api/patient-diary/admin`;

    const response = await fetch(url, {
      method: editingDiaryId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(diaryForm),
    });

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(
        data.message || "Unable to save follow-up"
      );
      return;
    }

    toast.success(
      editingDiaryId
        ? "Follow-up updated successfully"
        : "Follow-up added successfully"
    );

    setShowDiaryModal(false);
    resetDiaryForm();

    await getDiaryEntries();
  } catch (error) {
    console.error("SAVE DIARY ERROR:", error);
    toast.error("Server error");
  }
};


// =========================================================
// PATIENT DIARY - COMPLETE
// =========================================================

const completeDiaryEntry = async (id) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/patient-diary/admin/${id}/complete`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(
        data.message || "Unable to complete follow-up"
      );
      return;
    }

    toast.success("Follow-up marked as completed");

    await getDiaryEntries();
  } catch (error) {
    console.error("COMPLETE DIARY ERROR:", error);
    toast.error("Server error");
  }
};


// =========================================================
// PATIENT DIARY - DELETE
// =========================================================

const deleteDiaryEntry = async (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this follow-up?"
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/patient-diary/admin/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(
        data.message || "Unable to delete follow-up"
      );
      return;
    }

    toast.success("Follow-up deleted");

    await getDiaryEntries();
  } catch (error) {
    console.error("DELETE DIARY ERROR:", error);
    toast.error("Server error");
  }
};


// =========================================================
// PATIENT DIARY - IGNORE (reason is required)
// =========================================================

const openIgnoreModal = (entry) => {
  setIgnoreEntry(entry);
  setIgnoreReason("");
  setShowIgnoreModal(true);
};

const closeIgnoreModal = () => {
  if (ignoreSaving) return;
  setShowIgnoreModal(false);
  setIgnoreEntry(null);
  setIgnoreReason("");
};

const submitIgnoreEntry = async (e) => {
  e.preventDefault();

  const reason = ignoreReason.trim();

  if (!ignoreEntry?._id) {
    toast.error("Follow-up not found");
    return;
  }

  if (!reason) {
    toast.error("Please enter the reason for ignoring this follow-up");
    return;
  }

  try {
    setIgnoreSaving(true);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/patient-diary/admin/${ignoreEntry._id}/ignore`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(
        data.message || "Unable to ignore follow-up"
      );
      return;
    }

    toast.success("Follow-up moved to Ignored");

    setShowIgnoreModal(false);
    setIgnoreEntry(null);
    setIgnoreReason("");

    await getDiaryEntries();
  } catch (error) {
    console.error("IGNORE DIARY ERROR:", error);
    toast.error("Server error");
  } finally {
    setIgnoreSaving(false);
  }
};


// =========================================================
// PATIENT DIARY - EDIT
// =========================================================

const editDiaryEntry = (entry) => {
  setDiaryForm({
    patientName: entry.patientName || "",
    phone: entry.phone || "",
    doctor: entry.doctor || "",
    treatment: entry.treatment || "",
    previousVisitDate:
      entry.previousVisitDate?.slice(0, 10) || "",
    followUpDate:
      entry.followUpDate?.slice(0, 10) || "",
    notes: entry.notes || "",
    remarks: entry.remarks || "",
  });

  setEditingDiaryId(entry._id);
  setShowDiaryModal(true);
};


  /* =========================================================
     INITIAL LOAD + APPOINTMENT + CONTACT POLLING
     ========================================================= */
  useEffect(() => {
    if (!token) {
      window.location.href = "/pages/admin/login";
      return;
    }

    // Initial load - NO notification
    getAppointments(false);
    getContacts(false);

    getDoctors();
    getServices();
    getYoutubeVideos();
        loadAvailabilityBlocks();

    // Check appointments + contacts + slots every 10 seconds
    const appointmentInterval = setInterval(() => {
      getAppointments(true);

      getContacts(true);

      getOfflineSlots(slotDateRef.current);
      getSlotHolds(
  slotDateRef.current,
  slotDoctorRef.current
);
    }, 30000);

    return () => {
      clearInterval(appointmentInterval);
    };
  }, []);

  const getAppointments = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments/admin/appointments`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();


      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        if (!isAutoRefresh) {
          toast.error(data.message || "Unable to get appointments");
        }

        return;
      }

      if (!Array.isArray(data.appointments)) {
        setAppointments([]);
        return;
      }

      const latestAppointments = data.appointments;

      /* =====================================================
         FIRST LOAD
         Existing appointments ko seen mark karo
         ===================================================== */
      if (!appointmentsInitializedRef.current) {
        latestAppointments.forEach((appointment) => {
          const uniqueId = getAppointmentUniqueKey(appointment);

          if (uniqueId) {
            appointmentIdsRef.current.add(uniqueId);
          }
        });

        appointmentsInitializedRef.current = true;

 
      }

      /* =====================================================
         AUTO POLLING
         Sirf new appointments detect karo
         ===================================================== */
      else if (isAutoRefresh) {
        const newAppointments = latestAppointments.filter(
          (appointment) => {
            const uniqueId = getAppointmentUniqueKey(appointment);

            if (!uniqueId) {
              return false;
            }

            return !appointmentIdsRef.current.has(uniqueId);
          }
        );


        if (newAppointments.length > 0) {
          newAppointments.forEach((newAppointment) => {
            const appointmentKey =
              getAppointmentUniqueKey(newAppointment);

            queueNotification(
              <div
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: "14px",
                  width: "100%",
                  minHeight: "58px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    minWidth: "4px",
                    borderRadius: "10px",
                    background: "#d66d57",
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "#d66d57",
                      marginBottom: "5px",
                    }}
                  >
                    New Appointment
                  </div>

                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#303030",
                      lineHeight: "1.3",
                      marginBottom: "5px",
                    }}
                  >
                    {newAppointment.name || "New Patient"}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      lineHeight: "1.45",
                    }}
                  >
                    A new appointment has been booked.
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "#777",
                    }}
                  >
                    <span>
                      {newAppointment.appointment_date ||
                        newAppointment.date ||
                        "-"}
                    </span>

                    <span
                      style={{
                        width: "3px",
                        height: "3px",
                        borderRadius: "50%",
                        background: "#aaa",
                      }}
                    />

                    <span>
                      {formatTime(
                        newAppointment.appointment_time ||
                          newAppointment.time
                      )}
                    </span>

                    {newAppointment.consultationType && (
                      <>
                        <span
                          style={{
                            width: "3px",
                            height: "3px",
                            borderRadius: "50%",
                            background: "#aaa",
                          }}
                        />

                        <span
                          style={{
                            textTransform: "uppercase",
                          }}
                        >
                          {newAppointment.consultationType}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>,
              {
                toastId: `new-appointment-${appointmentKey}`,
                position: "top-right",
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                newestOnTop: false,

                style: {
                  background: "#ffffff",
                  color: "#303030",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  boxShadow: "0 12px 35px #ddd5d0",
                  border: "1px solid #eee6e2",
                  minWidth: "340px",
                  maxWidth: "390px",
                },

                progressStyle: {
                  background: "#d66d57",
                },
              }
            );
          });
        }

        /* ===================================================
           SAVE ALL CURRENT APPOINTMENT IDS
           =================================================== */
        latestAppointments.forEach((appointment) => {
          const uniqueId = getAppointmentUniqueKey(appointment);

          if (uniqueId) {
            appointmentIdsRef.current.add(uniqueId);
          }
        });
      }

      setAppointments(latestAppointments);
    } catch (error) {
      console.error("GET APPOINTMENTS ERROR:", error);

      if (!isAutoRefresh) {
        toast.error("Server error");
      }
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
    }
  };

 

const getConsultationFees = async () => {
  try {
    setFeeLoading(true);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/consultation-fees`
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(
        data.message || "Unable to fetch consultation fees"
      );
      return;
    }

    if (data.fees) {
      setConsultationFees({
        clinicFee: data.fees.clinicFee,
        videoFee: data.fees.videoFee,
        procedureFee: data.fees.procedureFee ?? 500,
      });
    }
  } catch (error) {
    console.error(
      "GET CONSULTATION FEES ERROR:",
      error
    );

    toast.error("Unable to load consultation fees");
  } finally {
    setFeeLoading(false);
  }
};



const saveConsultationFees = async (e) => {
  e.preventDefault();

  const clinicFee = Number(
    consultationFees.clinicFee
  );

  const videoFee = Number(
    consultationFees.videoFee
  );

  const procedureFee = Number(
    consultationFees.procedureFee
  );

  if (!Number.isFinite(clinicFee) || clinicFee < 0) {
    toast.error("Please enter a valid clinic consultation fee");
    return;
  }

  if (!Number.isFinite(videoFee) || videoFee < 0) {
    toast.error("Please enter a valid video consultation fee");
    return;
  }

  if (!Number.isFinite(procedureFee) || procedureFee < 0) {
    toast.error("Please enter a valid procedure fee");
    return;
  }

  try {
    setFeeSaving(true);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/consultation-fees`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          clinicFee,
          videoFee,
          procedureFee,
        }),
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(
        data.message ||
          "Unable to update consultation fees"
      );
      return;
    }

    setConsultationFees({
      clinicFee: data.fees.clinicFee,
      videoFee: data.fees.videoFee,
      procedureFee: data.fees.procedureFee ?? 500,
    });

    toast.success(
      "Consultation fees updated successfully"
    );
  } catch (error) {
    console.error(
      "SAVE CONSULTATION FEES ERROR:",
      error
    );

    toast.error("Server error");
  } finally {
    setFeeSaving(false);
  }
};


  const getContacts = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setContactLoading(true);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/contact/admin/messages`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        if (!isAutoRefresh) {
          toast.error(
            data.message || "Unable to get contact messages"
          );
        }

        return;
      }

      const latestContacts = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      /* =====================================================
         FIRST LOAD
         Existing contacts ko seen mark karo
         ===================================================== */
      if (!contactsInitializedRef.current) {
        latestContacts.forEach((contact) => {
          if (contact?._id) {
            contactIdsRef.current.add(String(contact._id));
          }
        });

        contactsInitializedRef.current = true;

      }

      /* =====================================================
         AUTO POLLING
         Sirf new contact inquiries detect karo
         ===================================================== */
      else if (isAutoRefresh) {
        const newContacts = latestContacts.filter(
          (contact) =>
            contact?._id &&
            !contactIdsRef.current.has(String(contact._id))
        );


        if (newContacts.length > 0) {
          newContacts.forEach((contact) => {
            queueNotification(
              <div
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: "14px",
                  width: "100%",
                  minHeight: "58px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    minWidth: "4px",
                    borderRadius: "10px",
                    background: "#d66d57",
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "#d66d57",
                      marginBottom: "5px",
                    }}
                  >
                    New Contact Inquiry
                  </div>

                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#303030",
                      lineHeight: "1.3",
                      marginBottom: "5px",
                    }}
                  >
                    {contact.name || "New Inquiry"}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      lineHeight: "1.45",
                    }}
                  >
                    {contact.subject || "New message received"}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "#777",
                    }}
                  >
                    {contact.phone && (
                      <span>{contact.phone}</span>
                    )}

                    {contact.phone && contact.email && (
                      <span
                        style={{
                          width: "3px",
                          height: "3px",
                          borderRadius: "50%",
                          background: "#aaa",
                        }}
                      />
                    )}

                    {contact.email && (
                      <span>{contact.email}</span>
                    )}
                  </div>
                </div>
              </div>,
              {
                toastId: `new-contact-${contact._id}`,
                position: "top-right",
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                newestOnTop: false,

                style: {
                  background: "#ffffff",
                  color: "#303030",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  boxShadow: "0 12px 35px #ddd5d0",
                  border: "1px solid #eee6e2",
                  minWidth: "340px",
                  maxWidth: "390px",
                },

                progressStyle: {
                  background: "#d66d57",
                },
              }
            );
          });
        }

        /* ===================================================
           SAVE ALL CURRENT CONTACT IDS
           =================================================== */
        latestContacts.forEach((contact) => {
          if (contact?._id) {
            contactIdsRef.current.add(String(contact._id));
          }
        });
      }

      setContacts(latestContacts);
    } catch (error) {
      console.error("GET CONTACTS ERROR:", error);

      if (!isAutoRefresh) {
        toast.error("Server error");
      }
    } finally {
      if (!isAutoRefresh) {
        setContactLoading(false);
      }
    }
  };

  const markContactAsRead = async (id) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/contact/admin/messages/${id}/read`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(data.message || "Unable to mark message as read");
      return;
    }

    // UI me bhi immediately read kar do
    setContacts((prevContacts) =>
      prevContacts.map((contact) =>
        contact._id === id
          ? { ...contact, isRead: true }
          : contact
      )
    );

    toast.success("Message marked as read");
  } catch (error) {
    console.error("MARK CONTACT READ ERROR:", error);
    toast.error("Server error");
  }
};

  const getDoctors = async () => {
    try {
      setDoctorLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/doctors`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        console.error("Doctors API error:", data.message);
        setDoctors([]);
        return;
      }

      setDoctors(
        Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error("Doctor loading error:", error);
      setDoctors([]);
    } finally {
      setDoctorLoading(false);
    }
  };

  const addDoctor = async (e) => {
    e.preventDefault();

    if (!doctorForm.name.trim()) {
      toast.error("Please enter doctor name");
      return;
    }

    try {
      setDoctorSaving(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/doctors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: doctorForm.name.trim(),
            specialization: doctorForm.specialization.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(data.message || "Unable to add doctor");
        return;
      }

      toast.success("Doctor added successfully");

      setDoctorForm({
        name: "",
        specialization: "",
      });

      getDoctors();
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setDoctorSaving(false);
    }
  };

  const addService = async (e) => {
    e.preventDefault();

    if (!serviceForm.name.trim()) {
      toast.error("Please enter service name");
      return;
    }

    if (!serviceForm.category) {
      toast.error("Please select category");
      return;
    }

    if (!serviceForm.description.trim()) {
      toast.error("Please enter service description");
      return;
    }

    if (
      serviceForm.amount !== "" &&
      (isNaN(Number(serviceForm.amount)) ||
        Number(serviceForm.amount) < 0)
    ) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (serviceForm.amount !== "" && !serviceForm.gstIncluded) {
      toast.error("Please select GST option");
      return;
    }

    if (!editingServiceId && !serviceForm.image) {
      toast.error("Please select service image");
      return;
    }

    try {
      setServiceSaving(true);

      const formData = new FormData();

      formData.append("name", serviceForm.name.trim());
      formData.append("category", serviceForm.category);
      formData.append("description", serviceForm.description.trim());
      formData.append("amount", serviceForm.amount);
      formData.append(
        "gstIncluded",
        serviceForm.amount !== "" && serviceForm.gstIncluded === "included"
          ? "true"
          : "false"
      );

      if (serviceForm.image) {
        formData.append("image", serviceForm.image);
      }

      const url = editingServiceId
        ? `${import.meta.env.VITE_API_URL}/api/admin/services/${editingServiceId}`
        : `${import.meta.env.VITE_API_URL}/api/admin/services`;

      const response = await fetch(url, {
        method: editingServiceId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();


      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(
          data.message ||
            (editingServiceId
              ? "Unable to update service"
              : "Unable to add service")
        );
        return;
      }

      toast.success(
        editingServiceId
          ? "Service updated successfully"
          : "Service added successfully"
      );

      await getServices();

      setServiceForm({
        name: "",
        category: "",
        description: "",
        amount: "",
        gstIncluded: "",
        image: null,
      });

      setServiceImagePreview("");
      setEditingServiceId(null);
    } catch (error) {
      console.error("SERVICE SAVE ERROR:", error);
      toast.error("Server error");
    } finally {
      setServiceSaving(false);
    }
  };

  const handleServiceImage = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setServiceForm((previous) => ({
      ...previous,
      image: file,
    }));

    setServiceImagePreview(URL.createObjectURL(file));
  };

  const addYoutubeVideo = async (e) => {
    e.preventDefault();

    if (!youtubeForm.title.trim()) {
      toast.error("Please enter video title");
      return;
    }

    if (!youtubeForm.link.trim()) {
      toast.error("Please enter YouTube video link");
      return;
    }

    if (!editingYoutubeId && !youtubeForm.thumbnail) {
      toast.error("Please select video thumbnail");
      return;
    }

    try {
      setYoutubeSaving(true);

      const formData = new FormData();

      formData.append("title", youtubeForm.title.trim());

      formData.append(
        "category",
        youtubeForm.category.trim() || "SKIN & HAIR"
      );

      formData.append("link", youtubeForm.link.trim());

      if (youtubeForm.thumbnail) {
        formData.append("thumbnail", youtubeForm.thumbnail);
      }

      const url = editingYoutubeId
        ? `${import.meta.env.VITE_API_URL}/api/admin/youtube/${editingYoutubeId}`
        : `${import.meta.env.VITE_API_URL}/api/admin/youtube`;

      const response = await fetch(url, {
        method: editingYoutubeId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(
          data.message ||
            (editingYoutubeId
              ? "Unable to update video"
              : "Unable to add video")
        );
        return;
      }

      toast.success(
        editingYoutubeId
          ? "YouTube video updated successfully"
          : "YouTube video added successfully"
      );

      setYoutubeForm({
        title: "",
        category: "",
        link: "",
        thumbnail: null,
      });

      setYoutubeThumbnailPreview("");
      setEditingYoutubeId(null);

      await getYoutubeVideos();
    } catch (error) {
      console.error("YOUTUBE SAVE ERROR:", error);
      toast.error("Server error");
    } finally {
      setYoutubeSaving(false);
    }
  };

  const handleYoutubeThumbnail = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setYoutubeForm((previous) => ({
      ...previous,
      thumbnail: file,
    }));

    setYoutubeThumbnailPreview(URL.createObjectURL(file));
  };

  const editYoutubeVideo = (video) => {
    setEditingYoutubeId(video._id);

    setYoutubeForm({
      title: video.title || "",
      category: video.category || "",
      link: video.link || "",
      thumbnail: null,
    });

    setYoutubeThumbnailPreview(
      video.thumbnail
        ? video.thumbnail.startsWith("http")
          ? video.thumbnail
          : `${import.meta.env.VITE_API_URL}${video.thumbnail}`
        : ""
    );

    setShowYoutube(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteYoutubeVideo = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this YouTube video?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/youtube/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(data.message || "Unable to delete YouTube video");
        return;
      }

      toast.success("YouTube video deleted successfully");

      await getYoutubeVideos();
    } catch (error) {
      console.error("DELETE YOUTUBE ERROR:", error);
      toast.error("Server error");
    }
  };

  const deleteDoctor = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this doctor?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/doctors/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(data.message || "Unable to delete doctor");
        return;
      }

      toast.success("Doctor deleted successfully");

      getDoctors();
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    toast.success("Logged out successfully!");

    setTimeout(() => {
      window.location.href = "/pages/admin/login";
    }, 1000);
  };

  const editService = (service) => {
    setEditingServiceId(service._id);

    setServiceForm({
      name: service.name || "",
      category: service.category || "",
      description: service.description || "",
      amount:
        service.amount !== undefined &&
        service.amount !== null &&
        service.amount !== ""
          ? String(service.amount)
          : "",
      gstIncluded:
        service.amount !== undefined &&
        service.amount !== null &&
        service.amount !== ""
          ? service.gstIncluded
            ? "included"
            : "not_included"
          : "",
      image: null,
    });

    setServiceImagePreview(
      service.image
        ? service.image.startsWith("http")
          ? service.image
          : `${import.meta.env.VITE_API_URL}${service.image}`
        : ""
    );

    setShowServices(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteService = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/services/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(data.message || "Unable to delete service");
        return;
      }

      toast.success("Service deleted successfully");

      await getServices();
    } catch (error) {
      console.error("DELETE SERVICE ERROR:", error);
      toast.error("Server error");
    }
  };

  const deleteAppointment = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments/admin/appointments/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Unable to delete appointment");
        return;
      }

      toast.success("Appointment deleted successfully");

      getAppointments(false);
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    }
  };

const markAppointmentAsAttended = async (id) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/appointments/admin/appointments/${id}/attended`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(
        data.message || "Unable to mark appointment as attended"
      );
      return;
    }

    setAppointments((prevAppointments) =>
      prevAppointments.map((appointment) =>
        appointment._id === id
          ? { ...appointment, attended: true }
          : appointment
      )
    );

    toast.success("Appointment marked as attended");
  } catch (error) {
    console.error("MARK APPOINTMENT ATTENDED ERROR:", error);
    toast.error("Server error");
  }
};

const markAppointmentAsUnattended = async (id) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/appointments/admin/appointments/${id}/unattended`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      toast.error(
        data.message || "Unable to mark appointment as unattended"
      );
      return;
    }

    setAppointments((prevAppointments) =>
      prevAppointments.map((appointment) =>
        appointment._id === id
          ? { ...appointment, attended: false }
          : appointment
      )
    );

    toast.success("Appointment marked as unattended");
  } catch (error) {
    console.error("MARK APPOINTMENT UNATTENDED ERROR:", error);
    toast.error("Server error");
  }
};


  const cancelAppointment = async (id) => {
  const confirmCancel = window.confirm(
    "Are you sure you want to cancel this appointment?"
  );

  if (!confirmCancel) {
    return;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/appointments/admin/appointments/${id}/cancel`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message || "Unable to cancel appointment");
      return;
    }

    toast.success("Appointment cancelled successfully");

    getAppointments(false);
  } catch (error) {
    console.error(error);
    toast.error("Server error");
  }
};

  const deleteContact = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/contact/admin/messages/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Unable to delete message");
        return;
      }

      toast.success("Message deleted successfully");

      getContacts(false);
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    }
  };

  const openReschedule = async (appointment) => {
    setSelectedAppointment(appointment);

    setRescheduleDate(appointment.appointment_date || "");

    setRescheduleTime(normalizeTime(appointment.appointment_time));

    setShowReschedule(true);

    try {
      const scheduleResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/schedule`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const scheduleData = await scheduleResponse.json();

      if (scheduleResponse.status === 401) {
        logout();
        return;
      }

      if (scheduleResponse.ok && scheduleData.schedule) {
        setRescheduleSchedule(scheduleData.schedule);
      }

          if (appointment.appointment_date) {
        await loadAvailabilityBlocks();
               await loadBookedTimes(
          appointment.appointment_date,
          appointment.doctor
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load reschedule data");
    }
  };

  const loadBookedTimes = async (date, doctor) => {
    const doctorName = doctor || "";

    try {
      setRescheduleLoading(true);

      const base = import.meta.env.VITE_API_URL;
      const authHeaders = { Authorization: `Bearer ${token}` };

      const getJson = async (url, options) => {
        const response = await fetch(url, options);
        const data = await response.json();
        return { ok: response.ok, data };
      };

      const [publicRes, offlineRes, holdRes] = await Promise.allSettled([
        getJson(
          `${base}/api/appointments/booked-times?date=${date}&doctor=${encodeURIComponent(doctorName)}`
        ),
        getJson(
          `${base}/api/appointments/admin/offline-slots?date=${date}`,
          { headers: authHeaders, cache: "no-store" }
        ),
        getJson(
          `${base}/api/appointments/admin/slot-holds?date=${date}&doctor=${encodeURIComponent(doctorName)}`,
          { headers: authHeaders, cache: "no-store" }
        ),
      ]);

      const booked = new Set();

      // 1) Online booked
      if (publicRes.status === "fulfilled" && publicRes.value.ok) {
        const data = publicRes.value.data;

        const times = Array.isArray(data.bookedTimes)
          ? data.bookedTimes
          : Array.isArray(data.times)
          ? data.times
          : Array.isArray(data.data)
          ? data.data
          : [];

        times
          .map((item) =>
            typeof item === "string"
              ? item
              : item?.appointment_time || item?.time || ""
          )
          .filter(Boolean)
          .forEach((t) => booked.add(normalizeTime(t)));
      }

      // 2) Offline booked
      if (offlineRes.status === "fulfilled" && offlineRes.value.ok) {
        const slots = Array.isArray(offlineRes.value.data.slots)
          ? offlineRes.value.data.slots
          : [];

        slots
          .filter((slot) => sameDoctor(slot.doctor, doctorName))
          .forEach((slot) => booked.add(normalizeTime(slot.time)));
      }

      // 3) Abhi koi book kar raha hai (patient / admin hold)
      if (holdRes.status === "fulfilled" && holdRes.value.ok) {
        const holds = Array.isArray(holdRes.value.data.holds)
          ? holdRes.value.data.holds
          : [];

        holds
          .filter((hold) => sameDoctor(hold.doctor, doctorName))
          .forEach((hold) => booked.add(normalizeTime(hold.time)));
      }

      // 4) Dashboard ke loaded appointments
      appointments
        .filter(
          (appointment) =>
            appointment.appointment_date === date &&
            sameDoctor(appointment.doctor, doctorName) &&
            appointment.appointment_status !== "cancelled" &&
            (appointment.payment_status === "paid" ||
              appointment.appointment_status === "confirmed")
        )
        .forEach((appointment) =>
          booked.add(normalizeTime(appointment.appointment_time))
        );

      const result = Array.from(booked).filter(Boolean);

      setBookedTimes(result);
      return result;
    } catch (error) {
      console.error("LOAD BOOKED TIMES ERROR:", error);
      setBookedTimes([]);
      return [];
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleRescheduleDate = async (e) => {
    const date = e.target.value;

    setRescheduleDate(date);
    setRescheduleTime("");

    if (!date) {
      setBookedTimes([]);
      return;
    }

    const day = getDayNameFromDate(date);
    const daySchedule = rescheduleSchedule[day];

    if (!daySchedule?.enabled) {
      toast.error(`${day} is closed`);
      setRescheduleDate("");
      return;
    }

       await loadBookedTimes(date, selectedAppointment?.doctor);
  };

  const saveReschedule = async () => {
    if (!selectedAppointment?._id) {
      toast.error("Appointment not found");
      return;
    }

    if (!rescheduleDate) {
      toast.error("Please select date");
      return;
    }
    if (rescheduleBlock) {
      toast.error(rescheduleBlock.message);
      return;
    }
    if (!rescheduleTime) {
      toast.error("Please select time");
      return;
    }

    const day = getDayNameFromDate(rescheduleDate);

    const daySchedule = rescheduleSchedule[day];

    if (!daySchedule?.enabled) {
      toast.error(`${day} is closed`);
      return;
    }

 const slots = generateTimeSlots(
  daySchedule.sessions?.length
    ? daySchedule.sessions
    : [
        {
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime,
        },
      ]
);

    if (!slots.some((slot) => slot.value === rescheduleTime)) {
      toast.error("Invalid clinic time slot");
      return;
    }

    const currentTime = normalizeTime(
      selectedAppointment.appointment_time
    );

    const isCurrentSlot =
      selectedAppointment.appointment_date === rescheduleDate &&
      currentTime === rescheduleTime;

      if (isPastSlot(rescheduleDate, rescheduleTime) && !isCurrentSlot) {
      toast.error("This time slot has already passed");
      return;
    }

    if (bookedTimes.includes(rescheduleTime) && !isCurrentSlot) {
      toast.error("This slot is already booked");
      return;
    }

    try {
      setRescheduleSaving(true);

      // Save se pehle latest booked data dobara check karo
      const latestBooked = await loadBookedTimes(
        rescheduleDate,
        selectedAppointment.doctor
      );

      if (latestBooked.includes(rescheduleTime) && !isCurrentSlot) {
        toast.error("This slot was just booked. Please choose another time.");
        setRescheduleTime("");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments/admin/appointments/${selectedAppointment._id}/reschedule`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: rescheduleDate,
            time: rescheduleTime,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        toast.error(
          data.message || "Unable to reschedule appointment"
        );
        return;
      }

      toast.success("Appointment rescheduled successfully");

      setShowReschedule(false);
      setSelectedAppointment(null);
      setRescheduleDate("");
      setRescheduleTime("");
      setBookedTimes([]);

      getAppointments(false);
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setRescheduleSaving(false);
    }
  };
  const rescheduleBlock = (() => {
    if (!rescheduleDate || !selectedAppointment) return null;

    const closure = findClosure(allClosures, rescheduleDate);
    if (closure) {
      return {
        message: `Clinic is closed on this date${
          closure.reason ? ` (${closure.reason})` : ""
        }`,
      };
    }

    const leave = findLeave(
      allLeaves,
      selectedAppointment.doctor,
      rescheduleDate
    );
    if (leave) {
      return {
        message: `${selectedAppointment.doctor} is on leave on this date${
          leave.reason ? ` (${leave.reason})` : ""
        }`,
      };
    }

    return null;
  })();
  const today = new Date().toISOString().split("T")[0];

  const todayAppointments = appointments.filter(
    (appointment) => appointment.appointment_date === today
  );


  const getYoutubeThumbnailUrl = (thumbnail) => {
    if (!thumbnail) return "";

    if (thumbnail.startsWith("http")) {
      return thumbnail;
    }

    return `${import.meta.env.VITE_API_URL}${thumbnail}`;
  };

const sendFollowUpReminder = async (entry) => {
  if (
    sendingReminderId === entry._id ||
    reminderSentId === entry._id
  ) {
    return;
  }

  try {
    setSendingReminderId(entry._id);

    const token = localStorage.getItem("adminToken");

    if (!token) {
      toast.error("Admin session expired. Please login again.");
      setSendingReminderId(null);
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/patient-diary/admin/${entry._id}/reminder`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(
        data?.message ||
          "Unable to send reminder SMS"
      );

      setSendingReminderId(null);
      return;
    }

    // SMS successfully accepted
    toast.success(
      data?.message ||
        "Reminder SMS sent successfully"
    );

    setSendingReminderId(null);
    setReminderSentId(entry._id);

    // Enable again after 30 seconds
    setTimeout(() => {
      setReminderSentId(null);
    }, 30000);

  } catch (error) {
    console.error(
      "SEND FOLLOW-UP REMINDER ERROR:",
      error
    );

    toast.error(
      "Unable to send reminder SMS"
    );

    setSendingReminderId(null);
  }
};

  
  return (

    <>
     {showWelcome && (
      <div className="welcome-curtain">
        <div className="welcome-curtain__left"></div>

        <div className="welcome-curtain__content">
          <h1>WELCOME TO ADMIN PANEL</h1>
        </div>

        <div className="welcome-curtain__right"></div>
      </div>
    )}
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span>CLINIC</span>

          <h2>Doctor Panel</h2>
        </div>

        <div className="admin-menu">
          <button
            className={
             !showContacts &&
              !showDoctors &&
              !showServices &&
              !showYoutube &&
              !showConsultationFees &&
              !showSlotManagement &&
              !showPatientDiary
                ? "active"
                : ""
            }
            onClick={() => {
              setShowContacts(false);
              setShowDoctors(false);
              setShowServices(false);
              setShowYoutube(false);
                setShowConsultationFees(false);
                setShowSlotManagement(false);
                setShowPatientDiary(false);

            }}
          >
            Appointments
          </button>
 <button
            className={showSlotManagement ? "active" : ""}
            onClick={openSlotManagement}
            
          >
            Slots Management
          </button>
          <button
            className={showContacts ? "active" : ""}
            onClick={() => {
              setShowContacts(true);
              setShowDoctors(false);
              setShowServices(false);
              setShowYoutube(false);
              getContacts(false);
                setShowConsultationFees(false);
                setShowSlotManagement(false);

            }}
          >
            Contact Messages
          </button>

          <button
            className={showDoctors ? "active" : ""}
            onClick={() => {
              setShowDoctors(true);
              setShowContacts(false);
              setShowServices(false);
              setShowYoutube(false);
              getDoctors();
                setShowConsultationFees(false);
                setShowSlotManagement(false);
                setShowPatientDiary(false);

            }}
          >
            Doctors
          </button>

          <button
            className={showServices ? "active" : ""}
            onClick={() => {
              setShowServices(true);
              setShowDoctors(false);
              setShowContacts(false);
              setShowYoutube(false);
              setShowPatientDiary(false);
              setShowConsultationFees(false);
              setShowSlotManagement(false);
              
              getServices();
            }}
          >
            Services
          </button>
        <button
  className={showPatientDiary ? "active" : ""}
  onClick={() => {
    setShowPatientDiary(true);
    setShowContacts(false);
    setShowDoctors(false);
    setShowServices(false);
    setShowYoutube(false);
    setShowConsultationFees(false);
    setShowSlotManagement(false);
    

    getDiaryEntries();
  }}
>
  Patient Diary
</button>
          <button
            className={showYoutube ? "active" : ""}
            onClick={() => {
              setShowYoutube(true);
              setShowServices(false);
              setShowDoctors(false);
              setShowContacts(false);
              setShowPatientDiary(false);
              getYoutubeVideos();
                setShowConsultationFees(false);
                setShowSlotManagement(false);

            }}
          >
            YouTube
          </button>

          <button
            onClick={() => {
              setShowSchedule(true);
              setShowSlotManagement(false);
              setShowPatientDiary(false);
            }}
          >
            Clinic Schedule
          </button>

         
          <button
  className={showConsultationFees ? "active" : ""}
  onClick={() => {
    setShowConsultationFees(true);

    setShowContacts(false);
    setShowDoctors(false);
    setShowServices(false);
    setShowYoutube(false);
    setShowSlotManagement(false);
setShowPatientDiary(false);
    getConsultationFees();
  }}
>
  Consultation Fees
</button>
<button onClick={() => setShowPassword(true)}>
  Admin Settings
</button>
        </div>

        <button className="admin-logout" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="admin-main">
 <header className="admin-topbar">
  <div>
    <span>ADMIN DASHBOARD</span>

    <h1>
      {showContacts
        ? "Contact Messages"
        : showDoctors
        ? "Doctors"
        : showServices
        ? "Services"
        : showYoutube
        ? "YouTube"
        : showSlotManagement
? "Slot Management"
: showPatientDiary
? "Patient Diary"
: showConsultationFees
? "Consultation Fees"
: "Appointments"}
    </h1>
  </div>

  <div
    className="admin-user"
    onClick={() => setShowAdminProfile(!showAdminProfile)}
  >
    <div className="admin-avatar">
      {admin.profileImage ? (
        <img
          src={
            admin.profileImage?.startsWith("http")
              ? admin.profileImage
              : `${import.meta.env.VITE_API_URL}${admin.profileImage}`
          }
          alt="Admin"
        />
      ) : (
        admin.username
          ? admin.username.charAt(0).toUpperCase()
          : "D"
      )}
    </div>

    <div>
      <strong>{admin.username}</strong>
      <small>Doctor / Admin</small>
    </div>
  </div>
</header>
{showAdminProfile && (
  <div
    className="admin-profile-overlay"
    onClick={() => setShowAdminProfile(false)}
  >
    <div
      className="admin-profile-card"
      onClick={(e) => e.stopPropagation()}
    >

      <button
        className="admin-profile-close"
        onClick={() => setShowAdminProfile(false)}
      >
        ×
      </button>

      <div className="admin-profile-card__top">
        <div className="admin-profile-big-avatar">
          {admin.profileImage ? (
            <img
              src={
                admin.profileImage?.startsWith("http")
                  ? admin.profileImage
                  : `${import.meta.env.VITE_API_URL}${admin.profileImage}`
              }
              alt="Admin Profile"
            />
          ) : (
            admin.username
              ? admin.username.charAt(0).toUpperCase()
              : "D"
          )}
        </div>

        <div className="admin-profile-status">
          <span></span>
          Active
        </div>
      </div>

      <div className="admin-profile-info">
        <h2>{admin.username || "Doctor"}</h2>

        <p className="admin-profile-role">
          Doctor / Admin
        </p>

        <div className="admin-profile-details">

          <div className="admin-profile-detail">
            <span>Username</span>
            <strong>{admin.username || "—"}</strong>
          </div>

          <div className="admin-profile-detail">
            <span>Email</span>
            <strong>{admin.email || "—"}</strong>
          </div>

        </div>
      </div>

   <button
  className="admin-profile-edit"
  onClick={() => {
    setShowAdminProfile(false);
    setShowPassword(true);
  }}
>
  Edit Profile
</button>

    </div>
  </div>
)}

{!showSlotManagement && !showPatientDiary && (
  <div className="admin-stats">
<div className="admin-stat-card">
  <span>Total Appointments</span>
  <strong>
    {appointments.length -
      appointments.filter(
        (appointment) => appointment.attended === true
      ).length}
  </strong>
</div>

<div className="admin-stat-card">
  <span>Today's Appointments</span>
  <strong>
    {todayAppointments.length -
      todayAppointments.filter(
        (appointment) => appointment.attended === true
      ).length}
  </strong>
</div>

  <div className="admin-stat-card">
    <span>Contact Messages</span>
    <strong>
      {contacts.filter((contact) => !contact.isRead).length}
    </strong>
  </div>
</div>
)}

{showSlotManagement ? (
  <div className="admin-appointments">
    <div className="admin-section-header">
      <div>
        <span>SLOT MANAGEMENT</span>
        <h2>Manage Appointment Slots</h2>
      </div>

      <button
        type="button"
        onClick={() => getOfflineSlots(slotDate)}
      >
        Refresh
      </button>
    </div>

    <div className="slot-filters">
      <div className="slot-filter-group">
        <label className="slot-filter-label">
          Select Date
        </label>

        <input
          type="date"
          value={slotDate}
          min={new Date().toISOString().split("T")[0]}
          onChange={handleSlotDateChange}
          className="slot-filter-input"
        />
      </div>

      {doctors.length > 0 && (
        <div className="slot-filter-group slot-doctor-group">
          <label className="slot-filter-label">
            Doctor
          </label>

          <select
            value={slotDoctor || doctors[0]?.name || ""}
onChange={async (e) => {
  const doctorName = e.target.value;
 if (
  offlineHoldRef.current ||
  offlineHoldCreationLockRef.current ||
  offlineHoldReleaseLockRef.current ||
  offlineBookingLockRef.current
) {
  toast.error("Please finish the current offline booking first");
  return;
}
  setSlotDoctor(doctorName);

  await Promise.all([
    getOfflineSlots(slotDate),
    getSlotHolds(slotDate, doctorName),
  ]);
}}
className="slot-filter-input"
          >
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor.name}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>

    {slotScheduleLoading ? (
      <div className="admin-empty">
        Loading clinic schedule...
      </div>
    ) : (() => {
      const day = getDayNameFromDate(slotDate);
      const daySchedule = slotSchedule[day];
      const activeDoctor = slotDoctor || doctors[0]?.name || "";

      const slotClosure = findClosure(allClosures, slotDate);

      if (slotClosure) {
        return (
          <div className="admin-empty">
            🏥 Clinic is closed on this date
            {slotClosure.reason ? ` — ${slotClosure.reason}` : ""}.
          </div>
        );
      }

      const slotLeave = findLeave(allLeaves, activeDoctor, slotDate);

      if (slotLeave) {
        return (
          <div className="admin-empty">
            🩺 {activeDoctor} is on leave on this date
            {slotLeave.reason ? ` — ${slotLeave.reason}` : ""}.
          </div>
        );
      }
      if (!daySchedule?.enabled) {
        return (
          <div className="admin-empty">
            {day || "Selected day"} is closed.
          </div>
        );
      }

const slots = generateTimeSlots(
  daySchedule.sessions?.length
    ? daySchedule.sessions
    : [
        {
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime,
        },
      ]
);
const onlineBookedMap = new Map(
  appointments
    .filter((appointment) => {
      return (
        String(appointment.appointment_date || "").trim() ===
          String(slotDate || "").trim() &&
        String(appointment.doctor || "").trim().toLowerCase() ===
          String(slotDoctor || "").trim().toLowerCase() &&
        appointment.payment_status === "paid" &&
        appointment.appointment_status === "confirmed" &&
        appointment.attended !== true
      );
    })
    .map((appointment) => [
      normalizeTime(appointment.appointment_time),
      appointment,
    ])
);

     const offlineBookedMap = new Map(
  offlineSlots
    .filter(
      (slot) =>
        String(slot.doctor || "").trim().toLowerCase() ===
        String(slotDoctor || "").trim().toLowerCase()
    )
    .map((slot) => [normalizeTime(slot.time), slot])
);

const slotHoldMap = new Map(
  slotHolds
    .filter(
      (hold) =>
        String(hold.doctor || "").trim().toLowerCase() ===
        String(slotDoctor || "").trim().toLowerCase()
    )
    .map((hold) => [normalizeTime(hold.time), hold])
);
      return (
        <div>
          <div className="slot-legend">
            <span>🟢 Available</span>
            <span>🟡 Patient is booking</span>
            <span>🔵 Booked Online</span>
            <span>🔴 Booked Offline</span>
          </div>

          {offlineSlotLoading ? (
            <div className="admin-empty">
              Loading slot status...
            </div>
          ) : (
            <div className="slot-grid">
              {slots.map((slot) => {
const time = normalizeTime(slot.value);

const onlineBooked = onlineBookedMap.get(time);
const offlineBooked = offlineBookedMap.get(time);
const activeHold = slotHoldMap.get(time);
  // Sirf past FREE slots hide honge.
  // Past booked slots hamesha dikhेंगे.
if (
  !onlineBooked &&
  !offlineBooked &&
  !activeHold &&
  isPastSlot(slotDate, time)
) {
  return null;
}

                return (
                  <div
                    key={slot.value}
                    className={`slot-card ${
                      onlineBooked
                        ? "slot-card-online"
                        : offlineBooked
                        ? "slot-card-offline"
                       : activeHold
? "slot-card-held"
: "slot-card-available"
                    }`}
                  >
                    <div className="slot-card-header">
                      <strong>{slot.label}</strong>

                      <span className="slot-status-icon">
                       {onlineBooked
  ? "🔵"
  : offlineBooked
  ? "🔴"
  : activeHold
  ? "🟡"
  : "🟢"}
                      </span>
                    </div>

                    <div
                      className={`slot-status ${
                        onlineBooked
                          ? "slot-status-online"
                          : offlineBooked
                          ? "slot-status-offline"
                          : activeHold
? "slot-status-held"
                          : "slot-status-available"
                      }`}
                    >
                     {onlineBooked
  ? "Booked Online"
  : offlineBooked
  ? "Booked Offline"
  : activeHold?.by === "patient"
  ? "Patient is booking"
  : activeHold?.by === "admin"
  ? activeHold.mine
    ? "Your booking in progress"
    : "Reserved by another admin"
  : "Available"}
                    </div>
                    {onlineBooked && (
  <div className="slot-patient-info">
    <div className="slot-patient-name">
      {onlineBooked.name || "Patient"}
    </div>

    <div className="slot-patient-phone">
      {onlineBooked.phone || "Phone not available"}
    </div>
  </div>
)}
{offlineBooked && (
  <div className="slot-patient-info">
    <div className="slot-patient-name">
      {offlineBooked.patientName || "Patient name not added"}
    </div>

    <div className="slot-patient-phone">
      {offlineBooked.patientPhone || "Mobile number not added"}
    </div>
  </div>
)}
{offlineBooked && (
  <div className="slot-offline-actions">
    <button
      type="button"
      className="slot-action-btn slot-edit-btn"
      disabled={
        offlineSlotAction ===
        `edit-${offlineBooked._id}`
      }
      onClick={() => {
        setOfflineInfoSlot(offlineBooked);
        setOfflineInfoName(
          offlineBooked.patientName || ""
        );
        setOfflineInfoPhone(
          offlineBooked.patientPhone || ""
        );
        setOfflineInfoModal(true);
        
        setOfflineInfoEditing(true);
      }}
    >
      {offlineSlotAction ===
      `edit-${offlineBooked._id}`
        ? "Updating..."
        : "Edit Info"}
    </button>

    <button
      type="button"
      className="slot-action-btn slot-release-btn"
      disabled={
        offlineSlotAction ===
        `release-${offlineBooked._id}`
      }
      onClick={() =>
        releaseOfflineSlot(offlineBooked._id)
      }
    >
      {offlineSlotAction ===
      `release-${offlineBooked._id}`
        ? "Releasing..."
        : "Release Slot"}
    </button>
  </div>
)}

{!onlineBooked && !offlineBooked && !activeHold && (
  
  <button
                        type="button"
                        className="slot-action-btn slot-book-btn"
                        disabled={
                          offlineSlotAction ===
                          `book-${slot.value}`
                        }
onClick={() => createOfflineHold(slot)}

                     
                     >
                        {offlineSlotAction ===
                        `book-${slot.value}`
                          ? "Booking..."
                          : "Book Offline"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    })()}
  </div>
        ) : showYoutube ? (
          <div className="admin-appointments">
            <div className="admin-section-header">
              <div>
                <span>YOUTUBE</span>

                <h2>Manage YouTube Videos</h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setYoutubeForm({
                    title: "",
                    category: "",
                    link: "",
                    thumbnail: null,
                  });

                  setYoutubeThumbnailPreview("");
                  setEditingYoutubeId(null);
                }}
              >
                Clear Form
              </button>
            </div>

            <form
              className="doctor-add-form"
              onSubmit={addYoutubeVideo}
            >
              <div className="doctor-form-field">
                <label>Video Title</label>

                <input
                  type="text"
                  value={youtubeForm.title}
                  onChange={(e) =>
                    setYoutubeForm({
                      ...youtubeForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. Skin Care & Treatment"
                />
              </div>

              <div className="doctor-form-field">
                <label>Category</label>

                <input
                  type="text"
                  value={youtubeForm.category}
                  onChange={(e) =>
                    setYoutubeForm({
                      ...youtubeForm,
                      category: e.target.value,
                    })
                  }
                  placeholder="e.g. SKIN CARE"
                />
              </div>

              <div className="doctor-form-field">
                <label>YouTube Video Link</label>

                <input
                  type="url"
                  value={youtubeForm.link}
                  onChange={(e) =>
                    setYoutubeForm({
                      ...youtubeForm,
                      link: e.target.value,
                    })
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="doctor-form-field">
                <label>Video Thumbnail</label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleYoutubeThumbnail}
                />

                {youtubeThumbnailPreview && (
                  <img
                    src={youtubeThumbnailPreview}
                    alt="YouTube Thumbnail Preview"
                    className="service-image-preview"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={youtubeSaving}
              >
                {youtubeSaving
                  ? editingYoutubeId
                    ? "Updating..."
                    : "Adding..."
                  : editingYoutubeId
                  ? "Update Video"
                  : "Add Video"}
              </button>
            </form>

            <div className="admin-section-header">
              <div>
                <span>ADDED VIDEOS</span>

                <h2>YouTube Video List</h2>
              </div>

              <button
                type="button"
                onClick={getYoutubeVideos}
              >
                Refresh
              </button>
            </div>

            {youtubeLoading ? (
              <div className="admin-empty">
                Loading YouTube videos...
              </div>
            ) : youtubeVideos.length === 0 ? (
              <div className="admin-empty">
                No YouTube videos added yet.
              </div>
            ) : (
              <div className="youtube-table-wrapper">
                <table className="appointment-table youtube-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Thumbnail</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Video Link</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {youtubeVideos.map((video, index) => (
                      <tr key={video._id}>
                        <td className="youtube-number-cell">
                          {index + 1}
                        </td>

                        <td className="youtube-thumbnail-cell">
                          {video.thumbnail ? (
                            <img
                              src={getYoutubeThumbnailUrl(
                                video.thumbnail
                              )}
                              alt={video.title}
                              className="youtube-table-thumbnail"
                            />
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="youtube-title-cell">
                          <strong>{video.title}</strong>
                        </td>

                        <td className="youtube-category-cell">
                          {video.category || "-"}
                        </td>

                        <td className="youtube-link-cell">
                          {video.link ? (
                            <a
                              href={video.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Video
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="youtube-action-cell">
                          <button
                            type="button"
                            onClick={() =>
                              editYoutubeVideo(video)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() =>
                              deleteYoutubeVideo(video._id)
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : showServices ? (
          <div className="admin-appointments">
            <div className="admin-section-header">
              <div>
                <span>SERVICES</span>

                <h2>Manage Services</h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setServiceForm({
                    name: "",
                    category: "",
                    description: "",
                    amount: "",
                    gstIncluded: "",
                    image: null,
                  });

                  setServiceImagePreview("");
                  setEditingServiceId(null);
                }}
              >
                Clear Form
              </button>
            </div>

            <form
              className="doctor-add-form"
              onSubmit={addService}
            >
              <div className="doctor-form-field">
                <label>Service Name</label>

                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Hydra Facial"
                />
              </div>

              <div className="doctor-form-field">
                <label>Category</label>

                <select
                  value={serviceForm.category}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select Category
                  </option>

                  {serviceCategories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="doctor-form-field">
                <label>Amount (₹)</label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  value={serviceForm.amount}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      amount: e.target.value,
                      gstIncluded:
                        e.target.value === ""
                          ? ""
                          : serviceForm.gstIncluded,
                    })
                  }
                  placeholder="e.g. 2500 (optional)"
                />
              </div>

              <div className="doctor-form-field">
                <label>GST (5%)</label>

                <select
                  value={serviceForm.gstIncluded}
                  disabled={serviceForm.amount === ""}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      gstIncluded: e.target.value,
                    })
                  }
                >
                  <option value="">Select GST option</option>
                  <option value="included">
                    5% GST Included
                  </option>
                  <option value="not_included">
                    5% GST Not Included
                  </option>
                </select>
              </div>

              <div className="doctor-form-field">
                <label>Description</label>

                <textarea
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter service description"
                  rows="5"
                />
              </div>

              <div className="doctor-form-field">
                <label>Service Image</label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleServiceImage}
                />

                {serviceImagePreview && (
                  <img
                    src={serviceImagePreview}
                    alt="Service Preview"
                    className="service-image-preview"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={serviceSaving}
              >
                {serviceSaving
                  ? editingServiceId
                    ? "Updating..."
                    : "Adding..."
                  : editingServiceId
                  ? "Update Service"
                  : "Add Service"}
              </button>
            </form>

            <div className="admin-section-header">
              <div>
                <span>ADDED SERVICES</span>

                <h2>Service List</h2>
              </div>
            </div>

            {services.length === 0 ? (
              <div className="admin-empty">
                No services added yet.
              </div>
            ) : (
              <div className="appointment-table-wrapper">
                <table className="appointment-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Image</th>
                      <th>Service</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {services.map(
                      (service, index) => (
                        <tr key={service._id}>
                          <td>{index + 1}</td>

                          <td>
                            {service.image ? (
                              <img
                                src={
                                  service.image.startsWith(
                                    "http"
                                  )
                                    ? service.image
                                    : `${import.meta.env.VITE_API_URL}${service.image}`
                                }
                                alt={service.name}
                                className="service-image-preview"
                              />
                            ) : (
                              "-"
                            )}
                          </td>

                          <td>
                            <strong>
                              {service.name}
                            </strong>
                          </td>

                          <td>
                            {service.category}
                          </td>

                          <td>
                            {service.description}
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() =>
                                editService(
                                  service
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() =>
                                deleteService(
                                  service._id
                                )
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : showDoctors ? (
          <div className="admin-appointments">
            <div className="admin-section-header">
              <div>
                <span>DOCTORS</span>

                <h2>Manage Doctors</h2>
              </div>

              <button onClick={getDoctors}>
                Refresh
              </button>
            </div>

            <form
              className="doctor-add-form"
              onSubmit={addDoctor}
            >
              <div className="doctor-form-field">
                <label>Doctor Name</label>

                <input
                  type="text"
                  value={doctorForm.name}
                  onChange={(e) =>
                    setDoctorForm({
                      ...doctorForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter doctor name"
                />
              </div>

              <div className="doctor-form-field">
                <label>Specialization</label>

                <input
                  type="text"
                  value={doctorForm.specialization}
                  onChange={(e) =>
                    setDoctorForm({
                      ...doctorForm,
                      specialization:
                        e.target.value,
                    })
                  }
                  placeholder="e.g. Dermatologist"
                />
              </div>

              <button
                type="submit"
                disabled={doctorSaving}
              >
                {doctorSaving
                  ? "Adding..."
                  : "Add Doctor"}
              </button>
            </form>

            {doctorLoading ? (
              <div className="admin-empty">
                Loading doctors...
              </div>
            ) : doctors.length === 0 ? (
              <div className="admin-empty">
                No doctors added yet.
              </div>
            ) : (
              <div className="appointment-table-wrapper">
                <table className="appointment-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Doctor</th>
                      <th>Specialization</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {doctors.map(
                      (doctor, index) => (
                        <tr key={doctor._id}>
                          <td>{index + 1}</td>

                          <td>
                            <strong>
                              {doctor.name}
                            </strong>
                          </td>

                          <td>
                            {doctor.specialization ||
                              "-"}
                          </td>

                          <td>
                            <button
                              className="delete-btn"
                              onClick={() =>
                                deleteDoctor(
                                  doctor._id
                                )
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          ) : showPatientDiary ? (

  <section className="patient-diary-page">

    {/* HEADER */}
    <div className="patient-diary-header">
      <div className="patient-diary-header-copy">
        <span className="patient-diary-eyebrow">Patient diary</span>
        <h2>PATIENT DIARY</h2>
        <p>Treatment follow-ups & patient reminders</p>
      </div>

      <button
        className="patient-diary-add-btn"
        onClick={() => {
          setEditingDiaryId(null);
          resetDiaryForm();
          setShowDiaryModal(true);
        }}
      >
        + Add Follow-up
      </button>
    </div>

    <div className="patient-diary-filter-card">
      <div className="patient-diary-filter-field patient-diary-filter-search">
        <input
          type="text"
          placeholder="Search patient name..."
          value={diarySearch}
          onChange={(e) => setDiarySearch(e.target.value)}
        />
      </div>

      <div className="patient-diary-filter-field">
        <input
          type="text"
          placeholder="Search mobile number..."
          value={diaryMobileSearch}
          onChange={(e) => setDiaryMobileSearch(e.target.value)}
        />
      </div>

      <div className="patient-diary-filter-field">
        <select
          value={diaryStatusFilter}
          onChange={(e) => setDiaryStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="ignored">Ignored</option>
        </select>
      </div>
    </div>

    <div className="diary-summary">
      <div className="diary-summary-card total">
        <div>
          <span>Total Entries</span>
          <strong>{diaryEntries.filter((entry) => !entry.ignored).length}</strong>
        </div>
      </div>

      <div className="diary-summary-card pending">
        <div>
          <span>Pending</span>
          <strong>
            {
              diaryEntries.filter((entry) => {
                if (entry.completed || entry.ignored) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const followUp = new Date(entry.followUpDate || "");
                followUp.setHours(0, 0, 0, 0);
                return Number.isFinite(followUp.getTime()) && followUp <= today;
              }).length
            }
          </strong>
        </div>
      </div>

      <div className="diary-summary-card upcoming">
        <div>
          <span>Upcoming</span>
          <strong>
            {
              diaryEntries.filter((entry) => {
                if (entry.completed || entry.ignored) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const followUp = new Date(entry.followUpDate || "");
                followUp.setHours(0, 0, 0, 0);
                return Number.isFinite(followUp.getTime()) && followUp > today;
              }).length
            }
          </strong>
        </div>
      </div>

      <div className="diary-summary-card completed">
        <div>
          <span>Completed</span>
          <strong>
            {diaryEntries.filter((entry) => entry.completed && !entry.ignored).length}
          </strong>
        </div>
      </div>
    </div>
    {/* CALENDAR + FOLLOW UPS */}
    <div className="patient-diary-content">

      {/* CALENDAR */}
      <div className="patient-diary-calendar-card">

        <div className="patient-diary-calendar-header">

          <button
            type="button"
            className="patient-diary-nav-btn"
            onClick={() =>
              setDiaryMonth(
                new Date(
                  diaryMonth.getFullYear(),
                  diaryMonth.getMonth() - 1,
                  1
                )
              )
            }
          >
            ‹
          </button>

          <div className="patient-diary-calendar-center">
            <h3>
              {diaryMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h3>

            <button
              type="button"
              className="patient-diary-today-btn"
              onClick={() => {
                const today = new Date();

                setDiaryMonth(
                  new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                  )
                );

                setDiarySelectedDate(
                  today.toISOString().split("T")[0]
                );
              }}
            >
              Today
            </button>
          </div>

          <button
            type="button"
            className="patient-diary-nav-btn"
            onClick={() =>
              setDiaryMonth(
                new Date(
                  diaryMonth.getFullYear(),
                  diaryMonth.getMonth() + 1,
                  1
                )
              )
            }
          >
            ›
          </button>

        </div>


        <div className="patient-diary-weekdays">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>


        <div className="patient-diary-calendar-grid">

          {(() => {

            const year = diaryMonth.getFullYear();
            const month = diaryMonth.getMonth();

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(
              year,
              month + 1,
              0
            ).getDate();

            const days = [];

            for (let i = 0; i < firstDay; i++) {
              days.push(
                <div
                  key={`empty-${i}`}
                  className="patient-diary-empty-day"
                />
              );
            }

            for (let day = 1; day <= daysInMonth; day++) {

              const date = new Date(
                year,
                month,
                day
              );

              const dateString =
                `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              const holidays = holidayByDate[dateString] || [];

              const dayEntries = diaryEntries.filter(
                (entry) =>
                  !entry.ignored &&
                  new Date(entry.followUpDate)
                    .toISOString()
                    .split("T")[0] === dateString
              );

              const isSelected =
                diarySelectedDate === dateString;

              const isToday =
                new Date().toISOString().split("T")[0] ===
                dateString;

              days.push(
                <button
                  key={dateString}
                  className={`patient-diary-day ${
                    isSelected ? "selected" : ""
                  } ${isToday ? "today" : ""}`}
                 onClick={() => {
  setDiarySelectedDate(
    diarySelectedDate === dateString ? "" : dateString
  );
}}
                >
                  <span>{day}</span>
{holidays.map((holiday) => (
  <p
    key={holiday.id}
    className="holiday-label1"
    title={holiday.summary}
  >
    {holiday.summary}
  </p>
))}
                  {dayEntries.length > 0 && (
                   <span className="appointment-count">
  {dayEntries.length}
</span>
                  )}
                </button>
              );
            }

            return days;

          })()}

        </div>

      </div>


      {/* FOLLOW-UP LIST */}
      <div className="patient-diary-list-card">

        <div className="patient-diary-list-header">

          <div>
            <h3>Follow-ups</h3>

            <p>
              {diarySelectedDate
                ? new Date(
                    diarySelectedDate
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Select a date"}
            </p>
          </div>

        </div>


        <div className="patient-diary-list">

          {diaryEntries
            .filter((entry) => {

    const entryDate = new Date(entry.followUpDate)
      .toISOString()
      .split("T")[0];

    const today = new Date()
      .toISOString()
      .split("T")[0];

    // IGNORED: sirf "Ignored" filter me dikhenge,
    // baaki sab jagah (All Status included) hidden
    if (diaryStatusFilter === "ignored") {
      if (!entry.ignored) return false;
    } else if (entry.ignored) {
      return false;
    }

    // SEARCH
    if (
      diarySearch &&
      !entry.patientName
        ?.toLowerCase()
        .includes(diarySearch.toLowerCase())
    ) {
      return false;
    }

  if (
  diaryMobileSearch &&
  !entry.phone
    ?.toString()
    .includes(diaryMobileSearch)
) {
  return false;
}

    // TREATMENT
    if (
      diaryTreatmentFilter &&
      entry.treatment !== diaryTreatmentFilter
    ) {
      return false;
    }

   // STATUS
if (diaryStatusFilter === "completed") {
  if (!entry.completed) return false;
}

if (diaryStatusFilter === "upcoming") {
  if (entry.completed || entryDate <= today) {
    return false;
  }
}

if (diaryStatusFilter === "pending") {
  if (entry.completed) {
    return false;
  }
}

    // CALENDAR DATE
if (
  diarySelectedDate &&
  entryDate !== diarySelectedDate
) {
  return false;
}

    return true;
  })
            .map((entry) => (

              <div
                className={`patient-diary-followup-card ${
                  entry.ignored
                    ? "ignored"
                    : entry.completed
                    ? "completed"
                    : (() => {
                        const followUp = new Date(entry.followUpDate);
                        const today = new Date();
                        followUp.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        return followUp > today ? "upcoming" : "pending";
                      })()
                }`}
                key={entry._id}
              >

                <div className="patient-diary-patient-info">

                  <div className="patient-diary-avatar">
                    {entry.patientName
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </div>

                  <div>
                    <h4>{entry.patientName}</h4>
                    <p>{entry.phone}</p>
                  </div>

                </div>
     <p className="patient-diary-followup-date">
  Follow-up:{" "}
  {entry.followUpDate
    ? new Date(entry.followUpDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—"}
</p>
<div className="patient-diary-status">
  {entry.ignored ? (
    <span
      className="diary-status-badge"
      style={{ background: "#ececec", color: "#666" }}
    >
      Ignored
    </span>
  ) : entry.completed ? (
    <span className="diary-status-badge completed">
      Completed
    </span>
  ) : !entry.followUpDate ? (
    <span className="diary-status-badge pending">
      Pending
    </span>
  ) : (() => {
      const followUp = new Date(entry.followUpDate);
      const today = new Date();

      followUp.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      return followUp > today ? (
        <span className="diary-status-badge upcoming">
          Upcoming
        </span>
      ) : (
        <span className="diary-status-badge pending">
          Pending
        </span>
      );
    })()}
</div>
                <div className="patient-diary-details">
 <div>
                    <span>Notes:-</span>
                    <strong>
                      {entry.notes || "No notes"}
                    </strong>
                  </div>
                  <div>
                    <span>Treatment:-</span>
                    <strong>
                      {entry.treatment || "—"}
                    </strong>
                  </div>

                  <div>
  <span>Remarks:-</span>
  <strong>{entry.remarks || "No remarks"}</strong>
</div>

                 

                </div>


    
{!entry.ignored && entry.completed && (
  <div className="patient-diary-actions">
    <button
      type="button"
      className="diary-delete-btn"
      onClick={() => deleteDiaryEntry(entry._id)}
    >
      Delete
    </button>
  </div>
)}
          
{entry.ignored && (
  <>
    <div className="patient-diary-details">
      <div>
        <span>Ignored reason:-</span>
        <strong>
          {entry.ignoreReason || "—"}
        </strong>
      </div>
    </div>

    <div className="patient-diary-actions">
      <button
        type="button"
        className="diary-delete-btn"
        onClick={() => deleteDiaryEntry(entry._id)}
      >
        Delete
      </button>
    </div>
  </>
)}

                {!entry.ignored && (
                <div className="patient-diary-actions">
<button
  className="diary-reminder-btn"
  onClick={() => sendFollowUpReminder(entry)}
  disabled={
    sendingReminderId === entry._id ||
    reminderSentId === entry._id
  }
>
  {sendingReminderId === entry._id
    ? "Sending..."
    : reminderSentId === entry._id
    ? "Sent ✓"
    : "Send Reminder 🔔"}
</button>
                  {!entry.completed && (
                    <button
                      className="diary-complete-btn"
                      onClick={() =>
                        completeDiaryEntry(entry._id)
                      }
                    >
                      Mark Completed
                    </button>
                  )}

                  <button
                    className="diary-edit-btn"
                    onClick={() =>
                      editDiaryEntry(entry)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="diary-delete-btn"
                    onClick={() =>
                      openIgnoreModal(entry)
                    }
                  >
                    Ignore
                  </button>

                </div>
                )}

              </div>

            ))}


          {diaryEntries.filter((entry) => {

            if (entry.ignored) return false;

            const entryDate =
              new Date(entry.followUpDate)
                .toISOString()
                .split("T")[0];

            return entryDate === diarySelectedDate;

          }).length === 0 && (

            <div className="patient-diary-empty-state">

              <div>📅</div>

              <h4>No follow-ups</h4>

              <p>
                No patient follow-up is scheduled
                for this date.
              </p>

              <button
                onClick={() => {
                  setEditingDiaryId(null);
                  resetDiaryForm();
                  setDiaryForm((prev) => ({
                    ...prev,
                    followUpDate: diarySelectedDate,
                  }));
                  setShowDiaryModal(true);
                }}
              >
                + Add Follow-up
              </button>

            </div>

          )}

        </div>

      </div>

    </div>


    {/* ADD / EDIT MODAL */}
    {showDiaryModal && (

      <div className="patient-diary-modal-overlay">

        <div className="patient-diary-modal">

          <div className="patient-diary-modal-header">

            <div>
              <h3>
                {editingDiaryId
                  ? "Edit Follow-up"
                  : "Add Follow-up"}
              </h3>

              <p>
                Add patient treatment follow-up
              </p>
            </div>

            <button
              type="button"
              className="patient-diary-close-btn"
              onClick={() =>
                setShowDiaryModal(false)
              }
            >
              ×
            </button>

          </div>


          <form onSubmit={saveDiaryEntry} className="patient-diary-form">
            <div className="patient-diary-modal-body">
              <div className="patient-diary-form-grid">
                <div className="patient-diary-form-group">
                  <label>Patient Name *</label>
                  <input
                    type="text"
                    value={diaryForm.patientName}
                    onChange={(e) =>
                      setDiaryForm({
                        ...diaryForm,
                        patientName: e.target.value,
                      })
                    }
                    placeholder="Enter patient name"
                    required
                  />
                </div>

                <div className="patient-diary-form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={diaryForm.phone}
                    onChange={(e) =>
                      setDiaryForm({
                        ...diaryForm,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    placeholder="Enter 10-digit phone number"
                    required
                  />
                </div>

                <div className="patient-diary-form-group patient-diary-form-group-full">
                  <label>Treatment</label>
                  <select
                    value={diaryForm.treatment}
                    onChange={(e) =>
                      setDiaryForm({
                        ...diaryForm,
                        treatment: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Treatment</option>
                    <option value="PRP therapy for hair growth">PRP therapy for hair growth</option>
                    <option value="GFC therapy for hair growth">GFC therapy for hair growth</option>
                    <option value="Meso therapy for hair growth">Meso therapy for hair growth</option>
                    <option value="Analogous Serum therapy for allergy">Analogous Serum therapy for allergy</option>
                    <option value="Skin Biopsy for chronic disease">Skin Biopsy for chronic disease</option>
                    <option value="Hydra facial">Hydra facial</option>
                    <option value="Oxygenio facial">Oxygenio facial</option>
                    <option value="Chemical peels for melasma">Chemical peels for melasma</option>
                    <option value="Chemical peels for acne">Chemical peels for acne</option>
                    <option value="RF therapy for skin tags and warts">RF therapy for skin tags and warts</option>
                    <option value="RF therapy for mole removal">RF therapy for mole removal</option>
                    <option value="CO2 laser for scar treatment">CO2 laser for scar treatment</option>
                    <option value="CO2 laser for keloid treatment">CO2 laser for keloid treatment</option>
                    <option value="CO2 laser for skin rejuvenation">CO2 laser for skin rejuvenation</option>
                    <option value="CO2 laser for skin tags and warts">CO2 laser for skin tags and warts</option>
                    <option value="Laser Hair reduction with 4 wavelength Laser">Laser Hair reduction with 4 wavelength Laser</option>
                    <option value="Carbon laser treatment ( Hollywood Peel)">Carbon laser treatment ( Hollywood Peel)</option>
                    <option value="Q-Switch Laser for Melasma reduction">Q-Switch Laser for Melasma reduction</option>
                    <option value="Q-Switch laser for Glow Toning">Q-Switch laser for Glow Toning</option>
                    <option value="Q-Switch laser for Tattoo removal">Q-Switch laser for Tattoo removal</option>
                    <option value="Dermaplaning & derma-abrasion">Dermaplaning & derma-abrasion</option>
                    <option value="Blackheads & Whiteheads treatment">Blackheads & Whiteheads treatment</option>
                    <option value="Full body laser hair reduction">Full body laser hair reduction</option>
                    <option value="Nail Surgery">Nail Surgery</option>
                    <option value="Dermoscopy for hair loss diagnosis">Dermoscopy for hair loss diagnosis</option>
                    <option value="Dermoscopy for skin diseases diagnosis">Dermoscopy for skin diseases diagnosis</option>
                    <option value="Alopecia areata treatment">Alopecia areata treatment</option>
                    <option value="Chronic skin diseases treatment">Chronic skin diseases treatment</option>
                    <option value="Pediatric dermatology">Pediatric dermatology</option>
                    <option value="Geriatric dermatology">Geriatric dermatology</option>
                    <option value="MNRF treatment for acne scar reduction">MNRF treatment for acne scar reduction</option>
                    <option value="MNRF treatment for skin rejuvenation">MNRF treatment for skin rejuvenation</option>
                    <option value="MNRF treatment for fine lines and open pores">MNRF treatment for fine lines and open pores</option>
                    <option value="Hesitation cut marks treatment">Hesitation cut marks treatment</option>
                    <option value="Ear lobe repair">Ear lobe repair</option>
                    <option value="Ear piercing">Ear piercing</option>
                    <option value="Nose piercing">Nose piercing</option>
                    <option value="Bikini & Underarms hair reduction laser">Bikini & Underarms hair reduction laser</option>
                    <option value="Vitiligo treatment">Vitiligo treatment</option>
                    <option value="Sexually transmitted disease treatment">Sexually transmitted disease treatment</option>
                    <option value="Consultation free for senior citizens & armed forces">Consultation free for senior citizens & armed forces</option>
                    <option value="Glutathione treatment for skin glow">Glutathione treatment for skin glow</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="patient-diary-form-group">
                  <label>Previous Visit Date *</label>
                  <input
                    type="date"
                    value={diaryForm.previousVisitDate}
                    onChange={(e) =>
                      setDiaryForm({
                        ...diaryForm,
                        previousVisitDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="patient-diary-form-group">
                  <label>Next Follow-up Date *</label>
                  <input
                    type="date"
                    value={diaryForm.followUpDate}
                    onChange={(e) =>
                      setDiaryForm({
                        ...diaryForm,
                        followUpDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {editingDiaryId && (
                  <div className="patient-diary-form-group patient-diary-form-group-full">
                    <label>Remarks</label>
                    <textarea
                      placeholder="Call kiya, patient ne kya reply diya..."
                      value={diaryForm.remarks}
                      onChange={(e) =>
                        setDiaryForm({
                          ...diaryForm,
                          remarks: e.target.value,
                        })
                      }
                      rows="3"
                    />
                  </div>
                )}
              </div>

              <div className="patient-diary-quick-date">
                <label>Quick Follow-up</label>
                <div className="quick-date-actions">
                  <button type="button" onClick={() => setDiaryQuickDate("7")}>7 Days</button>
                  <button type="button" onClick={() => setDiaryQuickDate("15")}>15 Days</button>
                  <button type="button" onClick={() => setDiaryQuickDate("1month")}>1 Month</button>
                  <button type="button" onClick={() => setDiaryQuickDate("custom")}>Custom</button>
                </div>
              </div>

              <div className="patient-diary-form-group patient-diary-form-group-full">
                <label>Notes</label>
                <textarea
                  rows="4"
                  value={diaryForm.notes}
                  onChange={(e) =>
                    setDiaryForm({
                      ...diaryForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Enter follow-up notes..."
                />
              </div>
            </div>

            <div className="patient-diary-modal-actions">
              <button type="button" onClick={() => setShowDiaryModal(false)}>
                Cancel
              </button>
              <button type="submit">
                {editingDiaryId ? "Update Follow-up" : "Save Follow-up"}
              </button>
            </div>
          </form>

          </div>

        </div>

      )}

    {/* IGNORE FOLLOW-UP MODAL */}
    {showIgnoreModal && (
      <div
        className="patient-diary-modal-overlay"
        onClick={closeIgnoreModal}
      >
        <div
          className="patient-diary-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="patient-diary-modal-header">
            <div>
              <h3>Ignore Follow-up</h3>

              <p>
                {ignoreEntry?.patientName || "Patient"}
                {ignoreEntry?.phone
                  ? ` • ${ignoreEntry.phone}`
                  : ""}
              </p>
            </div>

            <button
              type="button"
              className="patient-diary-close-btn"
              onClick={closeIgnoreModal}
            >
              ×
            </button>
          </div>

          <form onSubmit={submitIgnoreEntry} className="patient-diary-form">
            <div className="patient-diary-modal-body">
              <div className="patient-diary-form-grid">
                <div className="patient-diary-form-group patient-diary-form-group-full">
                  <label>Reason for ignoring *</label>

                  <textarea
                    rows="4"
                    value={ignoreReason}
                    onChange={(e) =>
                      setIgnoreReason(e.target.value)
                    }
                    placeholder="e.g. Patient already visited, wrong entry, patient not interested..."
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="patient-diary-modal-actions">
              <button
                type="button"
                onClick={closeIgnoreModal}
                disabled={ignoreSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  ignoreSaving || !ignoreReason.trim()
                }
              >
                {ignoreSaving ? "Saving..." : "Ignore Follow-up"}
              </button>
            </div>
          </form>        </div>
      </div>
    )}

    </section>
          ) : showConsultationFees ? (
          <section className="consultation-fees-panel">

            <div className="consultation-fees-header">
              <span>PAYMENT SETTINGS</span>

              <h2>Consultation Fees</h2>

              <p>
                Manage the booking fees for different
                consultation types.
              </p>
            </div>


            {feeLoading ? (
              <div className="consultation-fees-loading">
                Loading fees...
              </div>
            ) : (
              <form
                className="consultation-fees-form"
                onSubmit={saveConsultationFees}
              >

                <div className="consultation-fee-card">

                  <div>
                    <span>IN-PERSON CONSULTATION</span>

                    <h3>
                      Set In-person consultation Fee
                    </h3>
                  </div>

                  <div className="consultation-fee-input">
                    <span>₹</span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={consultationFees.clinicFee}
                      onChange={(e) =>
                        setConsultationFees((prev) => ({
                          ...prev,
                          clinicFee: e.target.value,
                        }))
                      }
                    />
                  </div>

                </div>


                <div className="consultation-fee-card">

                  <div>
                    <span>VIDEO CONSULTATION</span>

                    <h3>
                      Set Video consultation Fee
                    </h3>
                  </div>

                  <div className="consultation-fee-input">
                    <span>₹</span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={consultationFees.videoFee}
                      onChange={(e) =>
                        setConsultationFees((prev) => ({
                          ...prev,
                          videoFee: e.target.value,
                        }))
                      }
                    />
                  </div>

                </div>
              <div className="consultation-fee-card">
    <div>
      <span>PROCEDURE</span>
      <h3>Set Procedure Fee</h3>
    </div>

    <div className="consultation-fee-input">
      <span>₹</span>

      <input
        type="number"
        min="0"
        step="1"
        value={consultationFees.procedureFee}
        onChange={(e) =>
          setConsultationFees((prev) => ({
            ...prev,
            procedureFee: e.target.value,
          }))
        }
      />
    </div>
  </div>

                <button
                  type="submit"
                  className="consultation-fee-save"
                  disabled={feeSaving}
                >
                  {feeSaving
                    ? "SAVING..."
                    : "SAVE CHANGES"}
                </button>

              </form>
            )}

          </section>
          ) : !showContacts ? (
            <div className="admin-appointments">
             <div className="admin-section-header">
  <div>
    <span>BOOKINGS</span>
    <h2>
  {showAttendedView
    ? "Attended Appointments"
    : showAllAppointments
    ? "All Appointments"
    : "Today's Appointments"}
</h2>
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <input
      type="date"
      value={selectedAppointmentDate}
      onChange={(e) => {
        setSelectedAppointmentDate(e.target.value);
        setShowAllAppointments(false);
          setShowAttendedView(false);
      }}
    />

    <button
      type="button"
      onClick={() => {
        setSelectedAppointmentDate(
          new Date().toISOString().split("T")[0]
        );
        setShowAllAppointments(false);
        setShowAttendedView(false);
      }}
    >
      Today
    </button>

    <button
      type="button"
      onClick={() =>{ setShowAllAppointments(true);
         setShowAttendedView(false);
      }
      }
    >
      All
    </button>
<button
  type="button"
  onClick={() => {
    setShowAttendedView(true);
    setShowAllAppointments(false);
  }}
>
  Attended
</button>
    <button
      type="button"
      onClick={() => getAppointments(false)}
    >
      Refresh
    </button>
  </div>
</div>

              {loading ? (
                <div className="admin-empty">
                  Loading appointments...
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="admin-empty">
                  No appointments found.
                </div>
              ) : (
                <div className="appointment-table-wrapper">
                  <table className="appointment-table">
                  <thead>
    <tr>
      <th>No.</th>
      <th>Booking ID</th>
      <th>Patient</th>
      <th>Phone</th>
      <th>Doctor</th>
      <th>Type</th>
      <th>Service</th>
      <th>Status</th>
      <th>Fee</th>
      <th>Payment</th>
      <th>Date</th>
      <th>Time</th>
      <th>Address</th>
      <th>Message</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
{filteredAppointments.map((appointment, index) => (
        <tr key={appointment._id}>

        {/* No. */}
  <td className="appointment-no-cell">
    <span>{index + 1}</span>

    {appointment.appointment_date ===
      new Date().toISOString().split("T")[0] && (
      <span className="today-ribbon">TODAY</span>
    )}
  </td>
        {/* Booking ID */}
        <td>
          <strong>
            {appointment.appointmentNumber || "-"}
          </strong>
        </td>

        {/* Patient */}
        <td>
          
          <strong>{appointment.name || "-"}</strong>

          {appointment.email && (
            <small>{appointment.email}</small>
          )}
        </td>

        {/* Phone */}
        <td>
          {appointment.phone || "-"}
        </td>

        {/* Doctor */}
        <td>
          {appointment.doctor || "-"}
        </td>

        {/* Type */}
        <td>
          <strong
            className={
              appointment.consultationType === "video"
                ? "video-consultation"
                : "clinic-consultation"
            }
          >
            {getConsultationMode(
              appointment.consultationType
            )}
          </strong>
        </td>

        {/* Service */}
        <td>
          {appointment.service || "-"}
        </td>
<td>
  {!appointment.attended ? (
    <button
      type="button"
      className="attended-btn"
      onClick={() => markAppointmentAsAttended(appointment._id)}
    >
      Mark as Attended
    </button>
  ) : (
    <span
  className="attended-text"
  onDoubleClick={() => {
    if (
      window.confirm(
        "Mark this appointment as unattended?"
      )
    ) {
      markAppointmentAsUnattended(appointment._id);
    }
  }}
  title="Double-click to undo"
>
  Attended
</span>
  )}
</td>
        {/* Fee */}
        <td>
          ₹{appointment.consultationFee ?? 0}
        </td>

        {/* Payment */}
        <td>
          <span
            className={`payment-status ${
              appointment.payment_status === "paid"
                ? "payment-paid"
                : "payment-pending"
            }`}
          >
            {appointment.payment_status === "paid"
              ? "Paid"
              : appointment.payment_status || "-"}
          </span>
        </td>

        {/* Date */}
        <td >
          {appointment.appointment_date || "-"}
        </td>

        {/* Time */}
        <td>
          <span className="appointment-time">
            {formatTime(appointment.appointment_time)}
          </span>
        </td>

        {/* Address */}
        <td>
          {appointment.address || "-"}
        </td>

        {/* Message */}
        <td>
          {appointment.message || "-"}
        </td>

        {/* Actions */}
        <td>
          <button
            type="button"
            onClick={() => openReschedule(appointment)}
          >
            Reschedule
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={() =>
              cancelAppointment(appointment._id)
            }
            disabled={
              appointment.appointment_status === "cancelled"
            }
          >
            {appointment.appointment_status === "cancelled"
              ? "Cancelled"
              : "Cancel"}
          </button>

          {/* <button
            type="button"
            className="delete-btn"
            onClick={() =>
              deleteAppointment(appointment._id)
            }
          >
            Delete
          </button> */}
         
        </td>

      </tr>
    ))}
  </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="admin-appointments">
              <div className="admin-section-header">
                <div>
                  <span>CONTACT</span>

                  <h2>Contact Messages</h2>
                </div>

                <button onClick={() => getContacts(false)}>
                  Refresh
                </button>
              </div>

              {contactLoading ? (
                <div className="admin-empty">
                  Loading messages...
                </div>
              ) : contacts.length === 0 ? (
                <div className="admin-empty">
                  No contact messages found.
                </div>
              ) : (
                <div className="appointment-table-wrapper">
                  <table className="appointment-table">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Subject</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>

              <tbody>
    {contacts.map((contact, index) => (
      <tr key={contact._id}>
        <td>{index + 1}</td>

        <td>
          <strong>{contact.name}</strong>
        </td>

        <td>
          {contact.email}
        </td>

        <td>
          {contact.phone}
        </td>

        <td>
          {contact.subject}
        </td>

        <td>
          {contact.message}
        </td>

        <td>
          {new Date(contact.createdAt).toLocaleDateString(
            "en-IN"
          )}
        </td>

        <td>
          {/* Mark as Read */}
          {!contact.isRead && (
            <button
              type="button"
              onClick={() => markContactAsRead(contact._id)}
            >
              Mark as Read
            </button>
          )}

          {/* Already Read */}
          {contact.isRead && (
            <span
              style={{
                display: "inline-block",
                marginRight: "8px",
                fontSize: "12px",
                color: "#777",
              }}
            >
              Read
            </span>
          )}

          {/* Delete */}
          <button
            type="button"
            className="delete-btn"
            onClick={() => deleteContact(contact._id)}
          >
            Delete
          </button>
        </td>
      </tr>
    ))}
  </tbody>
                  </table>
                </div>
              )}
            </div>
          )}



        </main>
        {showSchedule && (
          <ScheduleModal
            token={token}
            logout={logout}
            closeModal={() => {
              setShowSchedule(false);
              loadAvailabilityBlocks();
            }}
          />
        )}

        {showPassword && (
          <ChangePasswordModal
            token={token}
            closeModal={() =>
              setShowPassword(false)
            }
          />
        )}

        {showReschedule && (
          <RescheduleModal
            appointment={selectedAppointment}
            date={rescheduleDate}
            time={rescheduleTime}
            schedule={rescheduleSchedule}
            bookedTimes={bookedTimes}
            loading={rescheduleLoading}
                        saving={rescheduleSaving}
            blocked={rescheduleBlock}
            onDateChange={handleRescheduleDate}
            onTimeChange={setRescheduleTime}
            onSave={saveReschedule}
            closeModal={() => {
              setShowReschedule(false);
              setSelectedAppointment(null);
              setBookedTimes([]);
            }}
          />
        )}
{offlineInfoModal && (
  <div
    className="offline-info-overlay"
    onClick={closeOfflineInfoModal}
  >
    <div
      className="offline-info-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="offline-info-header">
        <div>
          <span>
            {offlineInfoEditing ? "EDIT BOOKING" : "OFFLINE BOOKING"}
          </span>
          <h3>Patient Information</h3>
        </div>

        <button
          type="button"
          className="offline-info-close"
          onClick={closeOfflineInfoModal}
        >
          ×
        </button>
      </div>

      <div className="offline-info-form">
        <div className="offline-info-field">
          <label>Patient Name</label>
          <input
            type="text"
            value={offlineInfoName}
            onChange={(e) => setOfflineInfoName(e.target.value)}
            placeholder="Enter patient name"
          />
        </div>

        <div className="offline-info-field">
          <label>Mobile Number</label>
          <input
            type="tel"
            value={offlineInfoPhone}
            onChange={(e) =>
              setOfflineInfoPhone(
                e.target.value.replace(/\D/g, "").slice(0, 10)
              )
            }
            placeholder="Enter 10-digit mobile number"
            maxLength="10"
          />
        </div>
      </div>

      <div className="offline-info-actions">
        <button
          type="button"
          className="offline-info-cancel"
          onClick={closeOfflineInfoModal}
          disabled={Boolean(offlineSlotAction)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="offline-info-submit"
          disabled={
            Boolean(offlineSlotAction) ||
            (!offlineInfoEditing && !offlineHoldRef.current)
          }
          onClick={async () => {
            if (!offlineInfoSlot) return;

            if (offlineInfoEditing) {
              await updateOfflineSlotInfo(offlineInfoSlot._id);
              return;
            }

            if (!offlineInfoSlot.value) return;

            await bookOfflineSlot(offlineInfoSlot.value);
          }}
        >
          {offlineSlotAction.startsWith("book-")
            ? "Booking..."
            : offlineInfoEditing
            ? "Update Info"
            : "Book Slot"}
        </button>
      </div>
    </div>
  </div>
)}
      </div>
      
    </>);
  };

  const RescheduleModal = ({
    appointment,
    date,
    time,
    schedule,
    bookedTimes,
        loading,
    saving,
    blocked,
    onDateChange,
    onTimeChange,
    onSave,
    closeModal,
  }) => {
    const day = getDayNameFromDate(date);
    const daySchedule = schedule[day];

     const slots = daySchedule?.enabled && !blocked
  ? generateTimeSlots(
      daySchedule.sessions?.length
        ? daySchedule.sessions
        : [
            {
              startTime: daySchedule.startTime,
              endTime: daySchedule.endTime,
            },
          ]
    )
  : [];

     const currentTime = normalizeTime(
      appointment?.appointment_time
    );

    // Guzre hue slots chhupao (sirf current slot dikhta rahe)
    const visibleSlots = slots.filter((slot) => {
      const isCurrent =
        appointment?.appointment_date === date &&
        currentTime === slot.value;

      return isCurrent || !isPastSlot(date, slot.value);
    });

    return (
      <div
        className="schedule-overlay reschedule-overlay"
        style={{ zIndex: 9999 }}
      >
        <div className="schedule-modal reschedule-modal">
          <div className="schedule-modal-header reschedule-modal-header">
            <div>
              <span>APPOINTMENT MANAGEMENT</span>

              <h2>Reschedule Appointment</h2>

              <p>
                {appointment?.name || "Patient"}
              </p>
            </div>

            <button
              className="close-modal"
              onClick={closeModal}
              type="button"
            >
              ×
            </button>
          </div>

          <div className="schedule-body reschedule-body">
            <div className="reschedule-current-card">
              <div className="reschedule-current-icon">
                📅
              </div>

              <div>
                <span>Current Appointment</span>

                <strong>
                  {appointment?.appointment_date}
                </strong>

                <small>
                  {formatTime(
                    appointment?.appointment_time
                  )}
                </small>
              </div>
            </div>

            <div className="reschedule-field">
              <label>Select New Date</label>

              <input
                type="date"
                value={date}
                min={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                onChange={onDateChange}
              />
            </div>
            {date && daySchedule?.enabled && !blocked && (
              <div className="reschedule-field">
                <div className="reschedule-time-heading">
                  <label>Select New Time</label>

                  <span>
                    {day}
                  </span>
                </div>

                {loading ? (
                  <div className="reschedule-loading">
                    <span className="reschedule-loader"></span>
                    Loading available slots...
                  </div>
                             ) : visibleSlots.length === 0 ? (
                  <div className="reschedule-empty-time">
                    No time slots available.
                  </div>
                ) : (
                  <div className="reschedule-time-grid">
                                      {visibleSlots.map((slot) => {
                      const slotValue = slot.value;

                      const booked =
                        bookedTimes.includes(slotValue);

                      const currentSlot =
                        appointment?.appointment_date ===
                          date &&
                        currentTime === slotValue;

                      const disabled =
                        booked && !currentSlot;

                      const selected =
                        time === slotValue;

                      return (
                        <button
                          key={slotValue}
                          type="button"
                          disabled={disabled}
                          className={`
                            reschedule-time-btn
                            ${selected ? "selected" : ""}
                            ${disabled ? "booked" : ""}
                            ${
                              currentSlot
                                ? "current-slot"
                                : ""
                            }
                          `}
                          onClick={() =>
                            onTimeChange(slotValue)
                          }
                        >
                          <span>
                            {slot.label}
                          </span>

                          {currentSlot && (
                            <small>Current</small>
                          )}

                          {disabled && (
                            <small>Booked</small>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="reschedule-time-legend">
                  <div>
                    <span className="legend-dot available"></span>
                    Available
                  </div>

                  <div>
                    <span className="legend-dot selected"></span>
                    Selected
                  </div>

                  <div>
                    <span className="legend-dot booked"></span>
                    Booked
                  </div>
                </div>
              </div>
            )}

                     {date && (blocked || !daySchedule?.enabled) && (
              <div className="reschedule-closed">
                <strong>
                  {blocked ? blocked.message : `${day} is closed`}
                </strong>

                <span>
                  Please select another date.
                </span>
              </div>
            )}
          </div>

          <div className="schedule-modal-footer reschedule-footer">
            <button
              className="schedule-cancel"
              type="button"
              onClick={closeModal}
            >
              Cancel
            </button>

            <button
              className="schedule-save"
              type="button"
              onClick={onSave}
                           disabled={
                saving ||
                !date ||
                !time ||
                Boolean(blocked)
              }
            >
              {saving
                ? "Rescheduling..."
                : "Save Reschedule"}
            </button>
          </div>
        </div>
      </div>
    );
  };



  const formatTime12Hour = (time) => {
    if (!time) return "";

    const [hour, minute] = time.split(":").map(Number);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return time;
    }

    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${String(displayHour).padStart(2, "0")}:${String(
      minute
    ).padStart(2, "0")} ${period}`;
  };
const ScheduleModal = ({ token, logout, closeModal }) => {
    const defaultSessions = [
    {
      startTime: "10:30",
      endTime: "14:00",
    },
    {
      startTime: "16:00",
      endTime: "19:30",
    },
  ];

  const createScheduleWithSessions = () => {
    const data = {};

    days.forEach((day) => {
      data[day] = {
        enabled: day !== "Sunday",
        sessions: defaultSessions.map((session) => ({
          ...session,
        })),
      };
    });

    return data;
  };

  const [schedule, setSchedule] = useState(
    createScheduleWithSessions()
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeScheduleTab, setActiveScheduleTab] = useState("weekly");
  const [leaveDoctors, setLeaveDoctors] = useState([]);
  const [leaveDoctor, setLeaveDoctor] = useState("");
  const [leaveDoctorsLoading, setLeaveDoctorsLoading] = useState(false);
  const [doctorLeaves, setDoctorLeaves] = useState([]);
  const [doctorLeavesLoading, setDoctorLeavesLoading] = useState(false);
  const [doctorLeaveSaving, setDoctorLeaveSaving] = useState(false);
  const [doctorLeaveForm, setDoctorLeaveForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [doctorLeaveAffected, setDoctorLeaveAffected] = useState(null);
  const [clinicClosures, setClinicClosures] = useState([]);
  const [clinicClosuresLoading, setClinicClosuresLoading] = useState(false);
  const [clinicClosureSaving, setClinicClosureSaving] = useState(false);
  const [clinicClosureForm, setClinicClosureForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [clinicClosureAffected, setClinicClosureAffected] = useState(null);
  const leaveRequestIdRef = useRef(0);
  const leaveDoctorRef = useRef("");
  const isModalMountedRef = useRef(true);

  useEffect(() => {
    leaveDoctorRef.current = leaveDoctor;
  }, [leaveDoctor]);

  useEffect(() => {
    isModalMountedRef.current = true;

    return () => {
      isModalMountedRef.current = false;
    };
  }, []);

  const formatLeaveDate = (dateString) =>
    new Date(`${dateString}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getDateRangeDetails = (startDate, endDate) => {
    if (!startDate || (endDate && endDate < startDate)) return null;

    const effectiveEndDate = endDate || startDate;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${effectiveEndDate}T00:00:00`);
    let days = 0;
    const cursor = new Date(start);

    while (cursor <= end) {
      days += 1;
      cursor.setDate(cursor.getDate() + 1);
    }

    const startParts = start.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    const endParts = end.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    const sameMonth =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth();

    return {
      days,
      badge:
        startDate === effectiveEndDate
          ? startParts
          : sameMonth
          ? `${start.toLocaleDateString("en-GB", {
              day: "numeric",
            })}-${end.toLocaleDateString("en-GB", { day: "numeric" })} ${end.toLocaleDateString("en-GB", {
              month: "short",
            })}`
          : `${startParts} - ${endParts}`,
      preview:
        startDate === effectiveEndDate
          ? formatLeaveDate(startDate)
          : `${startParts} - ${formatLeaveDate(effectiveEndDate)}`,
    };
  };

  const getLocalToday = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
  };

  const getItemStatus = (startDate, endDate) =>
    startDate <= getLocalToday() && endDate >= getLocalToday()
      ? "Ongoing"
      : "Upcoming";

  const updateDoctorLeaveField = (field, value) =>
    setDoctorLeaveForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "startDate" &&
      previous.endDate &&
      previous.endDate < value
        ? { endDate: "" }
        : {}),
    }));

  const updateClinicClosureField = (field, value) =>
    setClinicClosureForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "startDate" &&
      previous.endDate &&
      previous.endDate < value
        ? { endDate: "" }
        : {}),
    }));

  const requestDoctorLeaveApi = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    if (response.status === 401) {
      logout();
      return null;
    }

    return { response, data };
  };

  const loadLeaveDoctors = async () => {
    try {
      setLeaveDoctorsLoading(true);

      const result = await requestDoctorLeaveApi(
        `${import.meta.env.VITE_API_URL}/api/admin/doctors`
      );
      if (!result) return;
      const { response, data } = result;

      if (!response.ok) {
        toast.error(data.message || "Unable to load doctors");
        setLeaveDoctors([]);
        setLeaveDoctor("");
        return;
      }

      const doctors = Array.isArray(data.data) ? data.data : [];
      setLeaveDoctors(doctors);
      setLeaveDoctor(doctors[0]?.name || "");
    } catch (error) {
      console.error("LOAD DOCTORS FOR LEAVE ERROR:", error);
      toast.error("Unable to load doctors");
      setLeaveDoctors([]);
      setLeaveDoctor("");
    } finally {
      setLeaveDoctorsLoading(false);
    }
  };

  const loadDoctorLeaves = async (doctorName) => {
    const requestId = ++leaveRequestIdRef.current;

    if (!doctorName) {
      setDoctorLeaves([]);
      setDoctorLeavesLoading(false);
      return;
    }

    const isStale = () =>
      requestId !== leaveRequestIdRef.current ||
      doctorName !== leaveDoctorRef.current ||
      !isModalMountedRef.current;

    try {
      setDoctorLeavesLoading(true);

      const result = await requestDoctorLeaveApi(
        `${import.meta.env.VITE_API_URL}/api/admin/doctor-leaves?doctor=${encodeURIComponent(doctorName)}`
      );
      if (!result) return;
      if (isStale()) return;
      const { response, data } = result;

      if (!response.ok) {
        toast.error(data.message || "Unable to load doctor leaves");
        setDoctorLeaves([]);
        return;
      }

      setDoctorLeaves(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      if (isStale()) return;
      console.error("LOAD DOCTOR LEAVES ERROR:", error);
      toast.error("Unable to load doctor leaves");
      setDoctorLeaves([]);
    } finally {
      if (!isStale()) {
        setDoctorLeavesLoading(false);
      }
    }
  };

  const addDoctorLeave = async () => {
    if (!leaveDoctor || !doctorLeaveForm.startDate) {
      toast.error("Please select a doctor and a From date");
      return;
    }

    if (
      doctorLeaveForm.endDate &&
      doctorLeaveForm.endDate < doctorLeaveForm.startDate
    ) {
      toast.error("To date must be on or after From date");
      return;
    }

    try {
      setDoctorLeaveSaving(true);

      const result = await requestDoctorLeaveApi(
        `${import.meta.env.VITE_API_URL}/api/admin/doctor-leaves`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            doctor: leaveDoctor,
            startDate: doctorLeaveForm.startDate,
            endDate: doctorLeaveForm.endDate || doctorLeaveForm.startDate,
            reason: doctorLeaveForm.reason.trim(),
          }),
        }
      );
      if (!result) return;
      const { response, data } = result;

      if (!response.ok) {
        toast.error(data.message || "Unable to add doctor leave");
        return;
      }

      const affected = data.data?.affected || {
        appointments: [],
        offlineSlots: 0,
      };
      setDoctorLeaveAffected(affected);
      setDoctorLeaveForm({
        startDate: "",
        endDate: "",
        reason: "",
      });
      await loadDoctorLeaves(leaveDoctorRef.current);

      if (
        affected.appointments.length === 0 &&
        affected.offlineSlots === 0
      ) {
        toast.success("Doctor leave added successfully");
      }
    } catch (error) {
      console.error("ADD DOCTOR LEAVE ERROR:", error);
      toast.error("Unable to add doctor leave");
    } finally {
      setDoctorLeaveSaving(false);
    }
  };

  const deleteDoctorLeave = async (leaveId) => {
    if (!window.confirm("Are you sure you want to delete this leave?")) {
      return;
    }

    try {
      const result = await requestDoctorLeaveApi(
        `${import.meta.env.VITE_API_URL}/api/admin/doctor-leaves/${leaveId}`,
        {
          method: "DELETE",
        }
      );
      if (!result) return;
      const { response, data } = result;

      if (!response.ok) {
        toast.error(data.message || "Unable to delete doctor leave");
        return;
      }

      setDoctorLeaveAffected(null);
      toast.success("Doctor leave deleted successfully");
      await loadDoctorLeaves(leaveDoctorRef.current);
    } catch (error) {
      console.error("DELETE DOCTOR LEAVE ERROR:", error);
      toast.error("Unable to delete doctor leave");
    }
  };

  const loadClinicClosures = async () => {
    try {
      setClinicClosuresLoading(true);
      const result = await requestDoctorLeaveApi(
        `${import.meta.env.VITE_API_URL}/api/admin/clinic-closures`
      );
      if (!result) return;
      const { response, data } = result;
      if (!response.ok) {
        toast.error(data.message || "Unable to load clinic closures");
        setClinicClosures([]);
        return;
      }
      setClinicClosures(
        Array.isArray(data.data?.closures) ? data.data.closures : []
      );
    } catch (error) {
      console.error("LOAD CLINIC CLOSURES ERROR:", error);
      toast.error("Unable to load clinic closures");
      setClinicClosures([]);
    } finally {
      setClinicClosuresLoading(false);
    }
  };

  const addClinicClosure = async () => {
    if (!clinicClosureForm.startDate) {
      toast.error("Please select a From date");
      return;
    }
    if (
      clinicClosureForm.endDate &&
      clinicClosureForm.endDate < clinicClosureForm.startDate
    ) {
      toast.error("To date must be on or after From date");
      return;
    }
    try {
      setClinicClosureSaving(true);
      setClinicClosureAffected(null);
      const result = await requestDoctorLeaveApi(
        `${import.meta.env.VITE_API_URL}/api/admin/clinic-closures`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...clinicClosureForm,
            endDate: clinicClosureForm.endDate || clinicClosureForm.startDate,
            reason: clinicClosureForm.reason.trim(),
          }),
        }
      );
      if (!result) return;
      const { response, data } = result;
      if (!response.ok) {
        toast.error(data.message || "Unable to add clinic closure");
        return;
      }
      const affected = data.data?.affected || {
        appointments: [],
        offlineSlots: 0,
      };
      setClinicClosureAffected(affected);
      setClinicClosureForm({ startDate: "", endDate: "", reason: "" });
      await loadClinicClosures();
      if (!affected.appointments.length && !affected.offlineSlots) {
        toast.success("Clinic closure added successfully");
      }
    } catch (error) {
      console.error("ADD CLINIC CLOSURE ERROR:", error);
      toast.error("Unable to add clinic closure");
    } finally {
      setClinicClosureSaving(false);
    }
  };

  const deleteClinicClosure = async (closureId) => {
    if (!window.confirm("Are you sure you want to delete this clinic closure?")) {
      return;
    }
    try {
      const result = await requestDoctorLeaveApi(
        `${import.meta.env.VITE_API_URL}/api/admin/clinic-closures/${closureId}`,
        { method: "DELETE" }
      );
      if (!result) return;
      const { response, data } = result;
      if (!response.ok) {
        toast.error(data.message || "Unable to delete clinic closure");
        return;
      }
      setClinicClosureAffected(null);
      toast.success("Clinic closure deleted successfully");
      await loadClinicClosures();
    } catch (error) {
      console.error("DELETE CLINIC CLOSURE ERROR:", error);
      toast.error("Unable to delete clinic closure");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadLeaveDoctors();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadClinicClosures();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDoctorLeaves(leaveDoctor);
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveDoctor]);
  const getDefaultSessions = () =>
    defaultSessions.map((session) => ({
      ...session,
    }));

  const normalizeDaySchedule = (dayData) => {
    if (!dayData) {
      return {
        enabled: true,
        sessions: getDefaultSessions(),
      };
    }

    /* NEW FORMAT */
    if (
      Array.isArray(dayData.sessions) &&
      dayData.sessions.length >= 2
    ) {
      return {
        enabled: true,
        sessions: [
          {
            startTime:
              dayData.sessions[0]?.startTime || "10:30",
            endTime:
              dayData.sessions[0]?.endTime || "14:00",
          },
          {
            startTime:
              dayData.sessions[1]?.startTime || "16:00",
            endTime:
              dayData.sessions[1]?.endTime || "19:30",
          },
        ],
      };
    }

    /* OLD FORMAT */
    if (dayData.startTime && dayData.endTime) {
      return {
        enabled: true,
        sessions: [
          {
            startTime: dayData.startTime,
            endTime: "14:00",
          },
          {
            startTime: "16:00",
            endTime: dayData.endTime,
          },
        ],
      };
    }

    return {
     enabled: true,
      sessions: getDefaultSessions(),
    };
  };

  useEffect(() => {
    getSchedule();
  }, []);

  const getSchedule = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/schedule`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.schedule) {
        const normalizedSchedule = {};

        days.forEach((day) => {
          normalizedSchedule[day] =
            normalizeDaySchedule(data.schedule[day]);
        });

        setSchedule(normalizedSchedule);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load schedule");
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     TOGGLE DAY
  ===================================================== */

  const toggleDay = (day) => {
    setSchedule((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        enabled: !previous[day]?.enabled,
      },
    }));
  };

  /* =====================================================
     CHANGE SESSION TIME
  ===================================================== */

  const changeSessionTime = (
    day,
    sessionIndex,
    field,
    value
  ) => {
    setSchedule((previous) => {
      const dayData = previous[day] || {
        enabled: true,
        sessions: getDefaultSessions(),
      };

      const sessions =
        Array.isArray(dayData.sessions) &&
        dayData.sessions.length >= 2
          ? dayData.sessions.map((session) => ({
              ...session,
            }))
          : getDefaultSessions();

      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        [field]: value,
      };

      return {
        ...previous,
        [day]: {
          ...dayData,
          sessions,
        },
      };
    });
  };

  /* =====================================================
     SAVE SCHEDULE
  ===================================================== */

  const saveSchedule = async () => {
    try {
      setSaving(true);

      /* VALIDATE */
      for (const day of days) {
        const dayData = schedule[day];

        if (!dayData) {
          toast.error(`${day} schedule is missing`);
          return;
        }

        if (!dayData.enabled) {
          continue;
        }

        const sessions = dayData.sessions || [];

        if (sessions.length < 2) {
          toast.error(`Both sessions are required for ${day}`);
          return;
        }

        const session1 = sessions[0];
        const session2 = sessions[1];

        if (
          !session1.startTime ||
          !session1.endTime ||
          !session2.startTime ||
          !session2.endTime
        ) {
          toast.error(`Both session timings are required for ${day}`);
          return;
        }

        if (session1.startTime >= session1.endTime) {
          toast.error(
            `Session 1 end time must be after start time for ${day}`
          );
          return;
        }

        if (session2.startTime >= session2.endTime) {
          toast.error(
            `Session 2 end time must be after start time for ${day}`
          );
          return;
        }

        /* BREAK */
        if (session2.startTime <= session1.endTime) {
          toast.error(
            `There must be a break between both sessions on ${day}`
          );
          return;
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/schedule`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            schedule,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.message || "Unable to save schedule"
        );
        return;
      }

      toast.success(
        "Clinic schedule saved successfully"
      );

      closeModal();
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="schedule-overlay">
          <div className="schedule-modal schedule-settings-modal">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="schedule-modal-header">
          <div>
            <span>CLINIC SETTINGS</span>

            <h2>Clinic Schedule</h2>

            <p>
              Select working days and set clinic timing.
            </p>
          </div>

          <button
            className="close-modal"
            onClick={closeModal}
            type="button"
          >
            ×
                      </button>
        </div>
        <div
          className="schedule-settings-tabs"
          role="tablist"
          aria-label="Clinic schedule sections"
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
              return;
            }

            event.preventDefault();
            const tabIds = ["weekly", "closure", "leave"];
            const currentIndex = tabIds.indexOf(activeScheduleTab);
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const nextTab =
              tabIds[
                (currentIndex + direction + tabIds.length) % tabIds.length
              ];
            setActiveScheduleTab(nextTab);
            document.getElementById(`schedule-tab-${nextTab}`)?.focus();
          }}
        >
          <button
            id="schedule-tab-weekly"
            className="schedule-settings-tab"
            type="button"
            role="tab"
            aria-selected={activeScheduleTab === "weekly"}
            aria-controls="schedule-panel-weekly"
            tabIndex={activeScheduleTab === "weekly" ? 0 : -1}
            onClick={() => setActiveScheduleTab("weekly")}
          >
            Weekly Timings
          </button>
          <button
            id="schedule-tab-closure"
            className="schedule-settings-tab"
            type="button"
            role="tab"
            aria-selected={activeScheduleTab === "closure"}
            aria-controls="schedule-panel-closure"
            tabIndex={activeScheduleTab === "closure" ? 0 : -1}
            onClick={() => setActiveScheduleTab("closure")}
          >
            Clinic Closure
          </button>
          <button
            id="schedule-tab-leave"
            className="schedule-settings-tab"
            type="button"
            role="tab"
            aria-selected={activeScheduleTab === "leave"}
            aria-controls="schedule-panel-leave"
            tabIndex={activeScheduleTab === "leave" ? 0 : -1}
            onClick={() => setActiveScheduleTab("leave")}
          >
            Doctor Leave
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

                <div className="schedule-body">
          <div
            id="schedule-panel-weekly"
            className="schedule-tab-panel schedule-weekly-panel"
            role="tabpanel"
            aria-labelledby="schedule-tab-weekly"
            hidden={activeScheduleTab !== "weekly"}
          >
          {loading ? (
            <div className="schedule-loading">
              Loading schedule...
            </div>
          ) : (
            <div className="schedule-weekly-rows">
            {days.map((day) => {

              const dayData =
                schedule[day] || {
                  enabled: false,
                  sessions: getDefaultSessions(),
                };

              const sessions =
                Array.isArray(dayData.sessions) &&
                dayData.sessions.length >= 2
                  ? dayData.sessions
                  : getDefaultSessions();

              const session1 = sessions[0];
              const session2 = sessions[1];

              return (
                <div
                  className="simple-schedule-row"
                  key={day}
                >

                  {/* =================================================
                      DAY
                  ================================================= */}

                  <div className="schedule-day-info">


                    <strong>{day}</strong>

                  </div>

                  {/* =================================================
                      SESSIONS
                  ================================================= */}

                  {dayData.enabled ? (

                    <div className="schedule-time">

                      {/* ===============================
                          SESSION 1
                      =============================== */}

                      <div className="schedule-session">

                        <span className="schedule-session-label">
                          Session 1
                        </span>

                        {/* START */}

                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >

                          <input
                            type="text"
                            value={formatTime12Hour(
                              session1.startTime
                            )}
                            readOnly
                            aria-label={`${day} session 1 start time`}
                            onClick={() => {
                              const input =
                                document.getElementById(
                                  `session1-start-${day}`
                                );

                              if (
                                input?.showPicker
                              ) {
                                input.showPicker();
                              }
                            }}
                            style={{
                              cursor: "pointer",
                            }}
                          />

                          <input
                            id={`session1-start-${day}`}
                            type="time"
                            value={
                              session1.startTime || ""
                            }
                            onChange={(e) =>
                              changeSessionTime(
                                day,
                                0,
                                "startTime",
                                e.target.value
                              )
                            }
                            style={{
                              position: "absolute",
                              width: "1px",
                              height: "1px",
                              opacity: 0,
                              pointerEvents: "none",
                            }}
                            aria-hidden="true"
                          />

                        </div>

                        <span>To</span>

                        {/* END */}

                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >

                          <input
                            type="text"
                            value={formatTime12Hour(
                              session1.endTime
                            )}
                            readOnly
                            aria-label={`${day} session 1 end time`}
                            onClick={() => {
                              const input =
                                document.getElementById(
                                  `session1-end-${day}`
                                );

                              if (
                                input?.showPicker
                              ) {
                                input.showPicker();
                              }
                            }}
                            style={{
                              cursor: "pointer",
                            }}
                          />

                          <input
                            id={`session1-end-${day}`}
                            type="time"
                            value={
                              session1.endTime || ""
                            }
                            onChange={(e) =>
                              changeSessionTime(
                                day,
                                0,
                                "endTime",
                                e.target.value
                              )
                            }
                            style={{
                              position: "absolute",
                              width: "1px",
                              height: "1px",
                              opacity: 0,
                              pointerEvents: "none",
                            }}
                            aria-hidden="true"
                          />

                        </div>

                      </div>

                

                      {/* ===============================
                          SESSION 2
                      =============================== */}

                      <div className="schedule-session">

                        <span className="schedule-session-label">
                          Session 2
                        </span>

                        {/* START */}

                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >

                          <input
                            type="text"
                            value={formatTime12Hour(
                              session2.startTime
                            )}
                            readOnly
                            aria-label={`${day} session 2 start time`}
                            onClick={() => {
                              const input =
                                document.getElementById(
                                  `session2-start-${day}`
                                );

                              if (
                                input?.showPicker
                              ) {
                                input.showPicker();
                              }
                            }}
                            style={{
                              cursor: "pointer",
                            }}
                          />

                          <input
                            id={`session2-start-${day}`}
                            type="time"
                            value={
                              session2.startTime || ""
                            }
                            onChange={(e) =>
                              changeSessionTime(
                                day,
                                1,
                                "startTime",
                                e.target.value
                              )
                            }
                            style={{
                              position: "absolute",
                              width: "1px",
                              height: "1px",
                              opacity: 0,
                              pointerEvents: "none",
                            }}
                            aria-hidden="true"
                          />

                        </div>

                        <span>To</span>

                        {/* END */}

                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >

                          <input
                            type="text"
                            value={formatTime12Hour(
                              session2.endTime
                            )}
                            readOnly
                            aria-label={`${day} session 2 end time`}
                            onClick={() => {
                              const input =
                                document.getElementById(
                                  `session2-end-${day}`
                                );

                              if (
                                input?.showPicker
                              ) {
                                input.showPicker();
                              }
                            }}
                            style={{
                              cursor: "pointer",
                            }}
                          />

                          <input
                            id={`session2-end-${day}`}
                            type="time"
                            value={
                              session2.endTime || ""
                            }
                            onChange={(e) =>
                              changeSessionTime(
                                day,
                                1,
                                "endTime",
                                e.target.value
                              )
                            }
                            style={{
                              position: "absolute",
                              width: "1px",
                              height: "1px",
                              opacity: 0,
                              pointerEvents: "none",
                            }}
                            aria-hidden="true"
                          />

                        </div>

                      </div>

                    </div>

                  ) : (

                    <div className="clinic-closed">
                      Closed
                    </div>

                  )}

                </div>
              );
            })}
            </div>
          )}
          </div>

                  <section
            id="schedule-panel-closure"
            className="schedule-tab-panel schedule-date-panel"
            role="tabpanel"
            aria-labelledby="schedule-tab-closure"
            hidden={activeScheduleTab !== "closure"}
          >
            {clinicClosureAffected &&
              (clinicClosureAffected.appointments.length > 0 ||
                clinicClosureAffected.offlineSlots > 0) && (
                <div className="schedule-doctor-leave-warning" role="status">
                  <div className="schedule-warning-heading">
                    <span aria-hidden="true">⚠</span>
                    <strong>These bookings were NOT cancelled</strong>
                    <button
                      type="button"
                      aria-label="Dismiss affected bookings warning"
                      onClick={() => setClinicClosureAffected(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="schedule-warning-items">
                    {clinicClosureAffected.appointments.map((appointment) => (
                      <span key={appointment._id}>
                        {appointment.name} — {appointment.doctor},{" "}
                        {formatLeaveDate(appointment.appointment_date)},{" "}
                        {appointment.appointment_time}
                      </span>
                    ))}
                    {clinicClosureAffected.offlineSlots > 0 && (
                      <span>
                        Offline slots not cancelled:{" "}
                        {clinicClosureAffected.offlineSlots}
                      </span>
                    )}
                  </div>
                  <p>
                    Reschedule or cancel these bookings from the Appointments
                    tab.
                  </p>
                </div>
              )}
            <div className="schedule-date-columns">
          <section className="schedule-doctor-leave schedule-date-card schedule-closure-card schedule-date-form">
            <div className="schedule-doctor-leave-header">
              <span className="schedule-date-icon" aria-hidden="true">🏥</span>
              <div>
                <span>CLINIC AVAILABILITY</span>
                <h3>Clinic Closure</h3>
                <p>Close the whole clinic for specific dates</p>
              </div>
            </div>

            <div className="schedule-doctor-leave-dates">
              <div className="schedule-doctor-leave-field">
                <label htmlFor="schedule-closure-start">From date</label>
                <input
                  id="schedule-closure-start"
                  type="date"
                  value={clinicClosureForm.startDate}
                  required
                  disabled={clinicClosureSaving}
                  onChange={(event) =>
                    updateClinicClosureField("startDate", event.target.value)
                  }
                />
              </div>
              <div className="schedule-doctor-leave-field">
                <label className="schedule-date-optional" htmlFor="schedule-closure-end">
                  To (optional)
                </label>
                <input
                  id="schedule-closure-end"
                  type="date"
                  min={clinicClosureForm.startDate || undefined}
                  value={clinicClosureForm.endDate}
                  disabled={clinicClosureSaving}
                  onChange={(event) =>
                    updateClinicClosureField("endDate", event.target.value)
                  }
                />
                <small>Leave empty for a single day</small>
              </div>
            </div>

            {getDateRangeDetails(
              clinicClosureForm.startDate,
              clinicClosureForm.endDate
            ) && (
              <p className="schedule-date-preview" role="status">
                {clinicClosureForm.endDate
                  ? `Will be closed ${getDateRangeDetails(
                      clinicClosureForm.startDate,
                      clinicClosureForm.endDate
                    ).preview} (${getDateRangeDetails(
                      clinicClosureForm.startDate,
                      clinicClosureForm.endDate
                    ).days} ${
                      getDateRangeDetails(
                        clinicClosureForm.startDate,
                        clinicClosureForm.endDate
                      ).days === 1
                        ? "day"
                        : "days"
                    })`
                  : `Will be closed on ${getDateRangeDetails(
                      clinicClosureForm.startDate,
                      ""
                    ).preview}`}
              </p>
            )}

            <div className="schedule-doctor-leave-field">
              <label htmlFor="schedule-closure-reason">
                Reason (optional)
                <span className="schedule-date-counter">
                  {clinicClosureForm.reason.length}/200
                </span>
              </label>
              <input
                id="schedule-closure-reason"
                type="text"
                maxLength={200}
                value={clinicClosureForm.reason}
                disabled={clinicClosureSaving}
                onChange={(event) =>
                  updateClinicClosureField("reason", event.target.value)
                }
              />
              <small>Reason is visible to patients.</small>
            </div>

            <button
              className="schedule-save schedule-doctor-leave-add schedule-date-add"
              type="button"
              disabled={
                clinicClosureSaving ||
                !clinicClosureForm.startDate
              }
              onClick={addClinicClosure}
            >
              {clinicClosureSaving ? (
                <>
                  <span className="schedule-inline-spinner" aria-hidden="true" />
                  Adding Closure...
                </>
              ) : (
                "Add Closure"
              )}
            </button>

          </section>
              <div className="schedule-doctor-leave-list schedule-date-list">
              <h4>Upcoming and ongoing closures</h4>
              {clinicClosuresLoading ? (
                <div className="schedule-doctor-leave-state schedule-date-loading" role="status">
                  <span className="schedule-inline-spinner" aria-hidden="true" />
                  Loading closures...
                </div>
              ) : clinicClosures.length === 0 ? (
                <div className="schedule-doctor-leave-state schedule-date-empty">
                  No upcoming closures.
                </div>
              ) : (
                clinicClosures.map((closure) => {
                  const range = getDateRangeDetails(
                    closure.startDate,
                    closure.endDate
                  );
                  return (
                    <div className="schedule-doctor-leave-item schedule-date-item" key={closure._id}>
                      <div className="schedule-date-badge" aria-label={`${range?.days} days`}>
                        <strong>{range?.badge}</strong>
                        <span>{range?.days} {range?.days === 1 ? "day" : "days"}</span>
                      </div>
                      <div className="schedule-date-item-content">
                        <span className={`schedule-date-status is-${getItemStatus(closure.startDate, closure.endDate).toLowerCase()}`}>
                          {getItemStatus(closure.startDate, closure.endDate)}
                        </span>
                        {closure.reason && <span>{closure.reason}</span>}
                      </div>
                      <button
                        className="schedule-date-delete"
                        type="button"
                        aria-label={`Delete closure ${formatLeaveDate(closure.startDate)}`}
                        onClick={() => deleteClinicClosure(closure._id)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          </section>

          <section
            id="schedule-panel-leave"
            className="schedule-tab-panel schedule-date-panel"
            role="tabpanel"
            aria-labelledby="schedule-tab-leave"
            hidden={activeScheduleTab !== "leave"}
          >
            {doctorLeaveAffected &&
              (doctorLeaveAffected.appointments.length > 0 ||
                doctorLeaveAffected.offlineSlots > 0) && (
                <div className="schedule-doctor-leave-warning" role="status">
                  <div className="schedule-warning-heading">
                    <span aria-hidden="true">⚠</span>
                    <strong>These bookings were NOT cancelled</strong>
                    <button
                      type="button"
                      aria-label="Dismiss affected bookings warning"
                      onClick={() => setDoctorLeaveAffected(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="schedule-warning-items">
                    {doctorLeaveAffected.appointments.map((appointment) => (
                      <span key={appointment._id}>
                        {appointment.name} — {formatLeaveDate(
                          appointment.appointment_date
                        )}, {appointment.appointment_time}
                      </span>
                    ))}
                    {doctorLeaveAffected.offlineSlots > 0 && (
                      <span>
                        Offline slots not cancelled:{" "}
                        {doctorLeaveAffected.offlineSlots}
                      </span>
                    )}
                  </div>
                  <p>
                    Reschedule or cancel these bookings from the
                    Appointments tab.
                  </p>
                </div>
              )}
            <div className="schedule-date-columns">
          <section className="schedule-doctor-leave schedule-date-card schedule-leave-card schedule-date-form">
            <div className="schedule-doctor-leave-header">
              <span className="schedule-date-icon" aria-hidden="true">🩺</span>
              <div>
                <span>DOCTOR AVAILABILITY</span>
                <h3>Doctor Leave</h3>
                <p>Mark a doctor unavailable for specific dates</p>
              </div>
            </div>

            <div className="schedule-doctor-leave-field">
              <label htmlFor="schedule-leave-doctor">Doctor</label>
              {leaveDoctorsLoading ? (
                <div className="schedule-doctor-leave-state schedule-date-loading" role="status">
                  <span className="schedule-inline-spinner" aria-hidden="true" />
                  Loading doctors...
                </div>
              ) : leaveDoctors.length === 0 ? (
                <div className="schedule-doctor-leave-state">
                  No doctors added yet
                </div>
              ) : (
                <select
                  id="schedule-leave-doctor"
                  value={leaveDoctor}
                  onChange={(event) => {
                    setDoctorLeaveAffected(null);
                    setDoctorLeaves([]);
                    setDoctorLeavesLoading(true);
                    setLeaveDoctor(event.target.value);
                  }}
                  disabled={doctorLeaveSaving}
                >
                  {leaveDoctors.map((doctor) => (
                    <option key={doctor._id} value={doctor.name}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {leaveDoctor && (
              <>
                <div className="schedule-doctor-leave-dates">
                  <div className="schedule-doctor-leave-field">
                    <label htmlFor="schedule-leave-start">From date</label>
                    <input
                      id="schedule-leave-start"
                      type="date"
                      value={doctorLeaveForm.startDate}
                      required
                      disabled={doctorLeaveSaving}
                      onChange={(event) =>
                        updateDoctorLeaveField("startDate", event.target.value)
                      }
                    />
                  </div>
                  <div className="schedule-doctor-leave-field">
                    <label htmlFor="schedule-leave-end">To (optional)</label>
                    <input
                      id="schedule-leave-end"
                      type="date"
                      min={doctorLeaveForm.startDate || undefined}
                      value={doctorLeaveForm.endDate}
                      disabled={doctorLeaveSaving}
                      onChange={(event) =>
                        updateDoctorLeaveField("endDate", event.target.value)
                      }
                    />
                    <small>Leave empty for a single day</small>
                  </div>
                </div>

                {getDateRangeDetails(
                  doctorLeaveForm.startDate,
                  doctorLeaveForm.endDate
                ) && (
                  <p className="schedule-date-preview" role="status">
                    {doctorLeaveForm.endDate
                      ? `Dr. ${leaveDoctor} will be on leave ${getDateRangeDetails(
                          doctorLeaveForm.startDate,
                          doctorLeaveForm.endDate
                        ).preview} (${getDateRangeDetails(
                          doctorLeaveForm.startDate,
                          doctorLeaveForm.endDate
                        ).days} ${
                          getDateRangeDetails(
                            doctorLeaveForm.startDate,
                            doctorLeaveForm.endDate
                          ).days === 1
                            ? "day"
                            : "days"
                        })`
                      : `Dr. ${leaveDoctor} will be on leave on ${getDateRangeDetails(
                          doctorLeaveForm.startDate,
                          ""
                        ).preview}`}
                  </p>
                )}

                <button
                  className="schedule-save schedule-doctor-leave-add schedule-date-add"
                  type="button"
                  disabled={
                    doctorLeaveSaving ||
                    !doctorLeaveForm.startDate
                  }
                  onClick={addDoctorLeave}
                >
                  {doctorLeaveSaving ? (
                    <>
                      <span className="schedule-inline-spinner" aria-hidden="true" />
                      Adding Leave...
                    </>
                  ) : (
                    "Add Leave"
                  )}
                </button>

              </>
            )}
          </section>
              {leaveDoctor && (
                <div className="schedule-doctor-leave-list schedule-date-list">
                  <h4>Upcoming and ongoing leaves</h4>
                  {doctorLeavesLoading ? (
                    <div className="schedule-doctor-leave-state schedule-date-loading" role="status">
                      <span className="schedule-inline-spinner" aria-hidden="true" />
                      Loading leaves...
                    </div>
                  ) : doctorLeaves.length === 0 ? (
                    <div className="schedule-doctor-leave-state schedule-date-empty">
                      No upcoming leaves for this doctor.
                    </div>
                  ) : (
                    doctorLeaves.map((leave) => {
                      const range = getDateRangeDetails(
                        leave.startDate,
                        leave.endDate
                      );
                      return (
                        <div
                          className="schedule-doctor-leave-item schedule-date-item"
                          key={leave._id}
                        >
                          <div className="schedule-date-badge" aria-label={`${range?.days} days`}>
                            <strong>{range?.badge}</strong>
                            <span>{range?.days} {range?.days === 1 ? "day" : "days"}</span>
                          </div>
                          <div className="schedule-date-item-content">
                            <span className={`schedule-date-status is-${getItemStatus(leave.startDate, leave.endDate).toLowerCase()}`}>
                              {getItemStatus(leave.startDate, leave.endDate)}
                            </span>
                            {leave.reason && <span>{leave.reason}</span>}
                          </div>
                          <button
                            className="schedule-date-delete"
                            type="button"
                            aria-label={`Delete leave ${formatLeaveDate(leave.startDate)}`}
                            onClick={() => deleteDoctorLeave(leave._id)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                            </svg>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

                <div
          className="schedule-modal-footer schedule-settings-footer"
          hidden={activeScheduleTab !== "weekly"}
        >

          <button
            className="schedule-cancel"
            onClick={closeModal}
            type="button"
          >
            Cancel
          </button>

          <button
            className="schedule-save"
            onClick={saveSchedule}
            disabled={saving}
            type="button"
          >
            {saving
              ? "Saving..."
              : "Save Schedule"}
          </button>

        </div>

      </div>
    </div>
  );
};

const ChangePasswordModal = ({
  token,
  closeModal,
}) => {
  const adminData = JSON.parse(
    localStorage.getItem("admin") || "{}"
  );

  const [username, setUsername] = useState(
    adminData.username || ""
  );

  const [email, setEmail] = useState(
    adminData.email || ""
  );

  const [profileImage, setProfileImage] = useState(
    adminData.profileImage || ""
  );
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);

  const [oldPassword, setOldPassword] = useState("");
const [removeProfileImage, setRemoveProfileImage] = useState(false);
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

// =========================
// PROFILE IMAGE CHANGE
// =========================
const handleProfileImageChange = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast.error("Please select an image");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    toast.error("Image size must be less than 2MB");
    return;
  }

  // Store actual file for Multer upload
  setSelectedProfileImage(file);
  setRemoveProfileImage(false);

  // Temporary preview
  const previewUrl = URL.createObjectURL(file);
  setProfileImage(previewUrl);
};

const handleRemoveProfileImage = () => {
  setProfileImage("");
  setSelectedProfileImage(null);
  setRemoveProfileImage(true);
};
// =========================
// UPDATE PROFILE
// =========================
const handleUpdateProfile = async () => {
  if (!username.trim()) {
    toast.error("Please enter username");
    return;
  }

  if (!email.trim()) {
    toast.error("Please enter email");
    return;
  }

  try {
    setProfileSaving(true);

    const formData = new FormData();

formData.append("username", username.trim());
formData.append("email", email.trim());

if (selectedProfileImage) {
  formData.append(
    "profileImage",
    selectedProfileImage
  );
}

if (removeProfileImage) {
  formData.append("removeProfileImage", "true");
}

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/profile`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      window.location.href = "/pages/admin/login"
      return;
    }

    if (!response.ok) {
      toast.error(
        data.message || "Unable to update profile"
      );
      return;
    }

    // Update localStorage
    const updatedAdmin = {
      ...adminData,
      username: data.admin.username,
      email: data.admin.email,
      profileImage: data.admin.profileImage,
    };

    localStorage.setItem(
      "admin",
      JSON.stringify(updatedAdmin)
    );

    // Set saved image path
    setProfileImage(data.admin.profileImage);

    // Remove selected temporary file
    setSelectedProfileImage(null);

    toast.success("Profile updated successfully");

    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    toast.error("Server error");
  } finally {
    setProfileSaving(false);
  }
};

  // =========================
  // CHANGE PASSWORD
  // =========================
  const handleChangePassword = async () => {
    if (!oldPassword) {
      toast.error("Please enter current password");
      return;
    }

    if (!newPassword) {
      toast.error("Please enter new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!confirmPassword) {
      toast.error("Please confirm new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setPasswordSaving(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        toast.error(
          data.message || "Current password is incorrect"
        );
        return;
      }

      if (!response.ok) {
        toast.error(
          data.message || "Unable to change password"
        );
        return;
      }

      toast.success("Password changed successfully");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);
      toast.error("Server error");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="schedule-overlay">
      <div className="schedule-modal">

        {/* HEADER */}
        <div className="schedule-modal-header">
          <div>
            <span>ADMIN ACCOUNT</span>

            <h2>Account Settings</h2>

            <p>
              Manage your username, email and password.
            </p>
          </div>

          <button
            className="close-modal"
            onClick={closeModal}
            type="button"
          >
            ×
          </button>
        </div>
       
        {/* BODY */}
        <div className="schedule-body">

          {/* ================= PROFILE ================= */}

          <div className="account-section-title">
            <span>PROFILE</span>
            <h3>Account Information</h3>
          </div>

       {/* PROFILE IMAGE */}
<div className="profile-picture-row">

  <div className="profile-picture-wrapper">
    {profileImage ? (
      <img
        src={
          profileImage?.startsWith("blob:") ||
          profileImage?.startsWith("http")
            ? profileImage
            : `${import.meta.env.VITE_API_URL}${profileImage}`
        }
        alt="Admin Profile"
        className="profile-picture"
      />
    ) : (
      <div className="profile-picture-placeholder">
        {username
          ? username.charAt(0).toUpperCase()
          : "A"}
      </div>
    )}
  </div>
<div className="profile-picture-info">
  <strong>Profile Picture</strong>

  <p>
    Upload your profile picture
  </p>

  <div className="profile-photo-actions">
    <label className="change-photo-btn">
      Change Photo

      <input
        type="file"
        accept="image/*"
        onChange={handleProfileImageChange}
        hidden
      />
    </label>

    {profileImage && (
      <button
  type="button"
  className="remove-photo-btn"
  onClick={handleRemoveProfileImage}
  title="Remove Photo"
>
  🗑️
</button>
    )}
  </div>
</div>

</div>

          {/* USERNAME */}
          <div className="simple-schedule-row">
            <div className="schedule-day-info">
              <strong>Username</strong>
            </div>

            <input
              type="text"
              className="password-input"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Enter username"
            />
          </div>

          {/* EMAIL */}
          <div className="simple-schedule-row">
            <div className="schedule-day-info">
              <strong>Email</strong>
            </div>

            <input
              type="email"
              className="password-input"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter email"
            />
          </div>

          {/* PROFILE BUTTON */}
          <div className="account-button-row">
            <button
              className="schedule-save"
              type="button"
              onClick={handleUpdateProfile}
              disabled={profileSaving}
            >
              {profileSaving
                ? "Saving..."
                : "Save Profile"}
            </button>
          </div>

          {/* ================= SECURITY ================= */}

          <div className="account-section-title security-title">
            <span>SECURITY</span>
            <h3>Change Password</h3>
          </div>

          {/* CURRENT PASSWORD */}
          <div className="simple-schedule-row">
            <div className="schedule-day-info">
              <strong>Current Password</strong>
            </div>

            <input
              type="password"
              className="password-input"
              value={oldPassword}
              onChange={(e) =>
                setOldPassword(e.target.value)
              }
              placeholder="Current password"
            />
          </div>

          {/* NEW PASSWORD */}
          <div className="simple-schedule-row">
            <div className="schedule-day-info">
              <strong>New Password</strong>
            </div>

            <input
              type="password"
              className="password-input"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              placeholder="New password"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="simple-schedule-row">
            <div className="schedule-day-info">
              <strong>Confirm Password</strong>
            </div>

            <input
              type="password"
              className="password-input"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Confirm new password"
            />
          </div>

          {/* PASSWORD BUTTON */}
          <div className="account-button-row">
            <button
              className="schedule-save"
              type="button"
              onClick={handleChangePassword}
              disabled={passwordSaving}
            >
              {passwordSaving
                ? "Changing..."
                : "Change Password"}
            </button>
          </div>

        </div>

        {/* FOOTER */}
        <div className="schedule-modal-footer">
          <button
            className="schedule-cancel"
            onClick={closeModal}
            type="button"
          >
            Close
          </button>
        </div>

      </div>
</div>
  );
};


export default AdminDashboard;