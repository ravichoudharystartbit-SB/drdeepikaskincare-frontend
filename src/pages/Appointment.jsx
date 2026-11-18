import "../css/Appointment.css";
import { useEffect, useState,useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import one from "../assets/one.png";
import app from "../assets/app.jpg";
import { generateTimeSlots } from "../utils/timeSlots";
import AppointmentCalendar from "../component/AppointmentCalendar";
import { ClinicStatusBanner } from "../component/ClinicStatus";


const emptyDoctorLeaveInfo = {
  leaves: [],
  onLeaveToday: false,
  currentLeave: null,
  nextAvailableDate: null,
};

const emptyClinicClosureInfo = {
  closures: [],
  closedToday: false,
  currentClosure: null,
  reopenDate: null,
};

const formatNoticeDate = (dateString) =>
  new Date(`${dateString}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const requestDoctorLeaveInfo = async (doctor, signal) => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/doctor-leaves?doctor=${encodeURIComponent(doctor)}`,
    { signal }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load doctor leave information");
  }

  return data.data || emptyDoctorLeaveInfo;
};

const requestClinicClosureInfo = async () => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/clinic-closures`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to load clinic closures");
  }

  return data.data || emptyClinicClosureInfo;
};

const smoothScrollToElement = (element, duration = 1000, offset = 20) => { 
   if (!element) return;

  const startY = window.scrollY;
  const targetY =
    element.getBoundingClientRect().top + window.scrollY - offset;
  const distance = targetY - startY;
  const startTime = performance.now();

  let stopped = false;
  const stop = () => {
    stopped = true;
  };

  // agar patient khud scroll kare to hum ruk jaate hain
  window.addEventListener("wheel", stop, { once: true, passive: true });
  window.addEventListener("touchstart", stop, { once: true, passive: true });

  const easeInOut = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const step = (now) => {
    if (stopped) return;

    const progress = Math.min((now - startTime) / duration, 1);

    window.scrollTo({
      top: startY + distance * easeInOut(progress),
      left: 0,
      behavior: "instant",
    });

    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

const Appointment = () => {
  const [step, setStep] = useState(1);
  const [verified, setVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpSending, setOtpSending] = useState(false);

  const [schedule, setSchedule] = useState({});
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
const paymentLockRef = useRef(false);

  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorLeaveInfo, setDoctorLeaveInfo] = useState(
    emptyDoctorLeaveInfo
  );
  const [doctorLeaveLoading, setDoctorLeaveLoading] = useState(false);
  const [clinicClosureInfo, setClinicClosureInfo] = useState(
    emptyClinicClosureInfo
  );
  const [clinicClosureLoading, setClinicClosureLoading] = useState(true);
const formRef = useRef(null);
  const skipInitialDoctorLeaveFetch = useRef(true);
  const [consultationFees, setConsultationFees] = useState({
    clinicFee: 200,
    videoFee: 500,
    procedureFee: 500,
  });

  const [feesLoading, setFeesLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    otp: "",
    doctor: "",
    consultationType: "",
    treatment: "",
    date: "",
    time: "",
    address: "",
    message: "",
  });

  useEffect(() => {
    if (skipInitialDoctorLeaveFetch.current) {
      skipInitialDoctorLeaveFetch.current = false;
      return undefined;
    }

    if (!form.doctor) {
      return undefined;
    }

    const controller = new AbortController();

    requestDoctorLeaveInfo(form.doctor, controller.signal)
      .then(setDoctorLeaveInfo)
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("GET DOCTOR LEAVE INFO ERROR:", error);
          setDoctorLeaveInfo(emptyDoctorLeaveInfo);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDoctorLeaveLoading(false);
        }
      });

    return () => controller.abort();
  }, [form.doctor]);

  useEffect(() => {
    let active = true;

    requestClinicClosureInfo()
      .then((info) => {
        if (active) setClinicClosureInfo(info);
      })
      .catch((error) => {
        console.error("GET CLINIC CLOSURE INFO ERROR:", error);
        if (active) setClinicClosureInfo(emptyClinicClosureInfo);
      })
      .finally(() => {
        if (active) setClinicClosureLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const [appointmentId, setAppointmentId] = useState("");
  const [showMedicinePopup, setShowMedicinePopup] = useState(false);
  const [medicineInterest, setMedicineInterest] = useState("");
const [showTokenPopup, setShowTokenPopup] = useState(false);
const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [searchParams] = useSearchParams();

  /* =========================
     PREFILL SERVICE
  ========================= */

useEffect(() => {
  const service = searchParams.get("service");

  if (service) {
    setForm((prev) => ({
      ...prev,
      treatment: service,
      consultationType: "procedure",
    }));
  }
}, [searchParams]);
const didAutoScroll = useRef(false);
useEffect(() => {
  if (didAutoScroll.current) return undefined;
  if (feesLoading || clinicClosureLoading) return undefined;

  const timer = setTimeout(() => {
    didAutoScroll.current = true;
    smoothScrollToElement(formRef.current);
  }, 300);

  return () => clearTimeout(timer);
}, [feesLoading, clinicClosureLoading]);
  /* =========================
     OTP COOLDOWN
  ========================= */

  useEffect(() => {
    if (otpCooldown <= 0) return;

    const timer = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpCooldown]);

  /* =========================
     GET DOCTORS
  ========================= */

  useEffect(() => {
    const getDoctors = async () => {
      try {
        setDoctorLoading(true);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/doctors`
        );

        const data = await response.json();

        if (Array.isArray(data.data)) {
          setDoctors(data.data);
        } else if (Array.isArray(data)) {
          setDoctors(data);
        } else {
          setDoctors([]);
        }
      } catch (error) {
        console.error("GET DOCTORS ERROR:", error);
        setDoctors([]);
      } finally {
        setDoctorLoading(false);
      }
    };

    getDoctors();
  }, []);

  /* =========================
     GET CONSULTATION FEES
  ========================= */

  useEffect(() => {
    const getConsultationFees = async () => {
      try {
        setFeesLoading(true);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/consultation-fees`
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            "CONSULTATION FEES ERROR:",
            data.message
          );
          return;
        }

      if (data.fees) {
  setConsultationFees({
    clinicFee: Number(data.fees.clinicFee),
    videoFee: Number(data.fees.videoFee),
    procedureFee: Number(data.fees.procedureFee),
  });
}
        
      } catch (error) {
        console.error(
          "GET CONSULTATION FEES ERROR:",
          error
        );
      } finally {
        setFeesLoading(false);
      }
    };

    getConsultationFees();
  }, []);

  /* =========================
     GET SCHEDULE
  ========================= */

  useEffect(() => {
    getSchedule();
  }, []);

  const getSchedule = async () => {
    try {
      setLoadingSchedule(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/schedule`
      );

      const data = await response.json();


      if (!response.ok) {
        console.error("Schedule error:", data.message);
        setSchedule({});
        return;
      }

      setSchedule(data.schedule || {});
    } catch (error) {
      console.error("Unable to load schedule:", error);
      setSchedule({});
    } finally {
      setLoadingSchedule(false);
    }
  };


    /* =========================
     SLOT HOLD (double booking protection)
  ========================= */

  const API_BASE = import.meta.env.VITE_API_URL;

  const [slotPool, setSlotPool] = useState([]);
  const [verifyToken, setVerifyToken] = useState("");
  const [hold, setHold] = useState(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(0);
  const holdRef = useRef(null);

  const saveHold = (h) => {
    holdRef.current = h;
    setHold(h);
  };

  const releaseHoldNow = async () => {
    const h = holdRef.current;
    if (!h) return;
    saveHold(null);
    try {
      await fetch(`${API_BASE}/api/appointments/holds/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdId: h.holdId, holdToken: h.holdToken }),
      });
    } catch (error) {
      console.error("RELEASE HOLD ERROR:", error);
    }
  };

  const refreshSlots = async () => {
    if (!form.date || !form.doctor) return;
    const booked = await getBookedTimes(form.date);
    setAvailableTimes(slotPool.filter((s) => !booked.includes(s.value)));
  };

  // Har 8 second mein slots refresh
  useEffect(() => {
    if (step !== 1 || !form.date || !form.doctor || slotPool.length === 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      if (!document.hidden) refreshSlots();
    }, 8000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form.date, form.doctor, slotPool]);

  // Hold countdown + expiry
  useEffect(() => {
    if (!hold) {
      setHoldSecondsLeft(0);
      return undefined;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((hold.expiresAtLocal - Date.now()) / 1000));
      setHoldSecondsLeft(left);
      if (left <= 0) {
        saveHold(null);
        setForm((prev) => ({ ...prev, time: "" }));
        toast.error("Your slot hold expired. Please select a time again.");
        refreshSlots();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hold]);

  // Page band/refresh hone par best-effort release
  useEffect(() => {
    const onLeave = () => {
      const h = holdRef.current;
      if (!h) return;
      const body = new URLSearchParams({
        holdId: h.holdId,
        holdToken: h.holdToken,
      });
      navigator.sendBeacon(`${API_BASE}/api/appointments/holds/release`, body);
    };
    window.addEventListener("pagehide", onLeave);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      onLeave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTimeChange = async (e) => {
    const value = e.target.value;

    if (!value) {
      await releaseHoldNow();
      setForm((prev) => ({ ...prev, time: "" }));
      return;
    }

    if (!verified || !verifyToken) {
      toast.error("Please verify your mobile number first");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/appointments/holds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-verify-token": verifyToken,
        },
        body: JSON.stringify({
          doctor: form.doctor,
          date: form.date,
          time: value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setVerified(false);
          setVerifyToken("");
          toast.error("Phone verification expired. Please verify again.");
        } else {
          toast.error(data.message || "This slot is not available.");
        }
        await refreshSlots();
        return;
      }

      saveHold({
        holdId: data.holdId,
        holdToken: data.holdToken,
        expiresAtLocal: Date.now() + (data.expiresAt - data.serverNow),
      });

      setForm((prev) => ({ ...prev, time: value }));
      await refreshSlots();
    } catch (error) {
      console.error("HOLD SLOT ERROR:", error);
      toast.error("Unable to hold this slot. Please try again.");
    }
  };
  /* =========================
     GET BOOKED TIMES
  ========================= */

  const getBookedTimes = async (date) => {
    try {
      const response = await fetch(
`${import.meta.env.VITE_API_URL}/api/appointments/booked-times?date=${date}&doctor=${encodeURIComponent(form.doctor)}&myHoldId=${encodeURIComponent(holdRef.current?.holdId || "")}`      );

      const data = await response.json();


      if (!response.ok) {
        setBookedTimes([]);
        return [];
      }

      const times = data.bookedTimes || [];

      setBookedTimes(times);

      return times;
    } catch (error) {
      console.error("Unable to load booked times:", error);

      setBookedTimes([]);

      return [];
    }
  };

  /* =========================
     COMMON CHANGE HANDLER
  ========================= */

  const changeHandler = (e) => {
    const { name, value } = e.target;

    if (name === "doctor") {
            releaseHoldNow();
      setSlotPool([]);
      setAvailableTimes([]);
      setBookedTimes([]);
      setDoctorLeaveInfo(emptyDoctorLeaveInfo);
      setDoctorLeaveLoading(Boolean(value));
      setForm((prev) => ({
        ...prev,
        doctor: value,
        date: "",
        time: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================
     DATE CHANGE
  ========================= */
const handleDateChange = async (e) => {
  // Doctor must be selected first
  if (!form.doctor) {
    toast.error("Please select a doctor first");
    e.target.value = "";
    return;
  }

  const value = e.target.value;
    await releaseHoldNow();

  if (!value) {
    setAvailableTimes([]);
        setSlotPool([]);
    setBookedTimes([]);

    setForm((prev) => ({
      ...prev,
      date: "",
      time: "",
    }));

    return;
  }

  const selectedDate = new Date(value + "T00:00:00");

  const dayName = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const daySchedule = schedule[dayName];

  if (!daySchedule || !daySchedule.enabled) {
    setAvailableTimes([]);
        setSlotPool([]);
    setBookedTimes([]);

    setForm((prev) => ({
      ...prev,
      date: value,
      time: "",
    }));

    return;
  }
const times = generateTimeSlots(
  daySchedule.sessions?.length
    ? daySchedule.sessions
    : [
        {
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime,
        },
      ]
);

  const booked = await getBookedTimes(value);

  // ==========================================
  // HIDE PAST SLOTS FOR TODAY ONLY
  // ==========================================

  const today = new Date();

  const todayDate =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

  let filteredTimes = times;

  if (value === todayDate) {
    const currentMinutes =
      today.getHours() * 60 + today.getMinutes();

    filteredTimes = times.filter((slot) => {
      const [hours, minutes] = slot.value
        .split(":")
        .map(Number);

      const slotMinutes =
        hours * 60 + minutes;

      // Only future slots will be shown
      return slotMinutes > currentMinutes;
    });
  }

  // ==========================================
  // REMOVE ALREADY BOOKED SLOTS
  // ==========================================

  const freeTimes = filteredTimes.filter(
    (slot) => !booked.includes(slot.value)
  );
  setSlotPool(filteredTimes);
  setAvailableTimes(freeTimes);

  setForm((prev) => ({
    ...prev,
    date: value,
    time: "",
  }));
};




  /* =========================
     SELECTED DAY
  ========================= */

  const getSelectedDay = () => {
    if (!form.date) return "";

    const date = new Date(form.date + "T00:00:00");

    return date.toLocaleDateString("en-US", {
      weekday: "long",
    });
  };

  const selectedDay = getSelectedDay();

  const selectedDaySchedule = selectedDay
    ? schedule[selectedDay]
    : null;

  /* =========================
     TODAY DATE
  ========================= */

  const getTodayDate = () => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const refreshDoctorLeave = async () => {
    if (!form.doctor) return;

    setDoctorLeaveLoading(true);

    try {
      const info = await requestDoctorLeaveInfo(form.doctor);
      setDoctorLeaveInfo(info);
    } catch (error) {
      console.error("REFRESH DOCTOR LEAVE INFO ERROR:", error);
      setDoctorLeaveInfo(emptyDoctorLeaveInfo);
    } finally {
      setDoctorLeaveLoading(false);
    }
  };

  const refreshClinicClosureInfo = async () => {
    setClinicClosureLoading(true);

    try {
      setClinicClosureInfo(await requestClinicClosureInfo());
    } catch (error) {
      console.error("REFRESH CLINIC CLOSURE INFO ERROR:", error);
      setClinicClosureInfo(emptyClinicClosureInfo);
    } finally {
      setClinicClosureLoading(false);
    }
  };

  /* =========================
     SEND OTP
  ========================= */

  const sendOTP = async () => {
    if (otpCooldown > 0 || otpSending) return;

    if (!form.phone) {
      toast.error("Please enter your phone number");
      return;
    }

    const phone = form.phone.replace(/\D/g, "");

    if (phone.length !== 10) {
      toast.error("Please enter a valid 10 digit phone number");
      return;
    }

    try {
      setOtpSending(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Unable to send OTP");
        return;
      }

      setOtpSent(true);
      setVerified(false);
      setOtpCooldown(30);

      toast.success("OTP sent to your phone");
    } catch (error) {
      console.error("SEND PHONE OTP ERROR:", error);

      toast.error("Unable to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  /* =========================
     VERIFY OTP
  ========================= */

  const verifyOTP = async () => {
    if (!form.otp) {
      toast.error("Please enter the OTP");
      return;
    }

    const phone = form.phone.replace(/\D/g, "");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
            otp: form.otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Invalid OTP");
        return;
      }

      setVerified(true);
            setVerifyToken(data.verifyToken || "");
      setOtpSent(false);

      try {
               const patientResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/appointments/patient-by-phone?phone=${phone}`,
          {
            headers: {
              "x-verify-token": data.verifyToken || "",
            },
          }
        );

        const patientData = await patientResponse.json();

    

        if (
          patientResponse.ok &&
          patientData.existingPatient &&
          patientData.patient
        ) {
          const patient = patientData.patient;
          const nextDoctor = patient.doctor || form.doctor;

          if (nextDoctor !== form.doctor) {
            setAvailableTimes([]);
            setBookedTimes([]);
            setDoctorLeaveInfo(emptyDoctorLeaveInfo);
            setDoctorLeaveLoading(Boolean(nextDoctor));
          }

          setForm((prev) => ({
            ...prev,
            name: patient.name || prev.name,
            phone,
            address: patient.address || prev.address,
            otp: "",
            doctor: nextDoctor,
            consultationType: prev.consultationType,
            treatment: prev.treatment,
            date: nextDoctor !== prev.doctor ? "" : prev.date,
            time: nextDoctor !== prev.doctor ? "" : prev.time,
            message: prev.message,
          }));

          toast.success(
            "Phone verified! Your previous details have been filled automatically."
          );

          return;
        }

        setForm((prev) => ({
          ...prev,
          phone,
          otp: "",
        }));

        toast.success(
          "Phone number verified successfully"
        );
      } catch (patientError) {
        console.error(
          "GET EXISTING PATIENT ERROR:",
          patientError
        );

        setForm((prev) => ({
          ...prev,
          phone,
          otp: "",
        }));

        toast.success(
          "Phone number verified successfully"
        );
      }
    } catch (error) {
      console.error(
        "VERIFY PHONE OTP ERROR:",
        error
      );

      toast.error("Unable to verify OTP");
    }
  };

  /* =========================
     BOOK APPOINTMENT
  ========================= */

  const continueToPayment = async (e) => {
    e.preventDefault();

    if (!verified) {
      toast.error(
        "Please verify your phone number first"
      );

      return;
    }

    if (!form.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!form.doctor) {
      toast.error("Please select a doctor");
      return;
    }

    if (!form.consultationType) {
      toast.error(
        "Please select consultation type"
      );

      return;
    }

    /* =========================
       PROCEDURE VALIDATION
       ========================= */

    if (
      form.consultationType === "procedure" &&
      !form.treatment
    ) {
      toast.error("Please select a procedure");
      return;
    }

    if (!form.date) {
      toast.error(
        "Please select appointment date"
      );

      return;
    }

    if (!form.time) {
      toast.error(
        "Please select appointment time"
      );

      return;
    }

    /*
      Medicine interest popup is required
      only for video consultation.
    */

    if (form.consultationType === "video") {
      setShowMedicinePopup(true);
      return;
    }

    /*
      Clinic consultation and Procedure
      can be booked directly.
    */

    await bookAppointment("");
  };

const bookAppointment = async (selectedMedicineInterest) => {
  if (paymentLockRef.current) return;
  paymentLockRef.current = true;
  try {
      setShowMedicinePopup(false);

      toast.info("Opening payment...");
      // ==========================================
      // HOLD 10 MINUTE EXTEND (backend confirm)
      // ==========================================

      const currentHold = holdRef.current;

      if (!currentHold) {
        toast.error("Your slot hold expired. Please select the time again.");
        setForm((prev) => ({ ...prev, time: "" }));
        await refreshSlots();
        return;
      }

      const startResponse = await fetch(
        `${API_BASE}/api/appointments/holds/start-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-verify-token": verifyToken,
          },
          body: JSON.stringify({
            holdId: currentHold.holdId,
            holdToken: currentHold.holdToken,
          }),
        }
      );

      const startData = await startResponse.json();

      if (!startResponse.ok) {
        saveHold(null);
        setForm((prev) => ({ ...prev, time: "" }));
        await refreshSlots();
        throw new Error(
          startData.message || "Your slot hold expired. Please select the time again."
        );
      }

      saveHold({
        ...currentHold,
        expiresAtLocal: Date.now() + (startData.expiresAt - startData.serverNow),
      });
      // ==========================================
      // CREATE RAZORPAY ORDER
      // ==========================================

      const orderResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/appointments/create-payment-order`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: form.name,
            phone: form.phone,

            doctor: form.doctor,

            consultationType:
              form.consultationType,

            /*
              Treatment will be sent ONLY
              when Procedure is selected.
            */

            treatment:
              form.consultationType === "procedure"
                ? form.treatment
                : "",

            medicineInterest:
              form.consultationType === "video"
                ? selectedMedicineInterest
                : null,

            appointment_date: form.date,

            appointment_time: form.time,

            address: form.address,

            message: form.message,
               holdId: currentHold.holdId,
            holdToken: currentHold.holdToken,
          }),
        }
      );

      const orderData =
        await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message ||
            "Failed to create payment order."
        );
      }

      // ==========================================
      // RAZORPAY OPTIONS
      // ==========================================
      let paymentHandled = false;

      const razorpayOptions = {
        key: orderData.keyId,

        amount:
          orderData.amount * 100,

        currency:
          orderData.currency || "INR",

        name: "Clinic",

        description:
          form.consultationType === "video"
            ? "Video Consultation"
            : form.consultationType === "procedure"
            ? "Procedure"
            : "In-Person Consultation",

        order_id:
          orderData.orderId,

        prefill: {
          name: form.name,

          hidden: {
  email: true,
},

          contact: form.phone,
        },

        notes: {
          consultationType:
            form.consultationType,

          appointmentDate:
            form.date,

          appointmentTime:
            form.time,
        },

        theme: {
          color: "#111111",
        },

        // ========================================
        // PAYMENT SUCCESS
        // ========================================

        handler: async function (
          paymentResponse
        ) {
               paymentHandled = true;
          try {
            toast.info(
              "Verifying payment..."
            );

            // ====================================
            // VERIFY PAYMENT ON BACKEND
            // ====================================

            const verifyResponse =
              await fetch(
                `${import.meta.env.VITE_API_URL}/api/appointments/verify-payment`,
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    razorpay_order_id:
                      paymentResponse.razorpay_order_id,

                    razorpay_payment_id:
                      paymentResponse.razorpay_payment_id,

                    razorpay_signature:
                      paymentResponse.razorpay_signature,

                    medicineInterest:
                      selectedMedicineInterest,
                  }),
                }
              );

            const verifyData =
              await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed."
              );
            }

            // ====================================
            // SUCCESS
            // ====================================

            setAppointmentId(
              verifyData.appointmentNumber ||
                verifyData.appointmentId
            );

            setMedicineInterest(
              selectedMedicineInterest
            );

            toast.success(
              "Payment successful! Your appointment details have been submitted."
            );
            saveHold(null);
            setStep(3);

          } catch (error) {
            console.error(
              "PAYMENT VERIFICATION ERROR:",
              error
            );

            if (
              error.message?.includes("not available on the selected date") ||
              error.message?.includes("became unavailable")
            ) {
              refreshDoctorLeave();
            }
            if (
              error.message?.includes("Clinic is closed on the selected date.") ||
              error.message?.includes("clinic became closed")
            ) {
              refreshClinicClosureInfo();
            }

            toast.error(
              error.message ||
                "Payment verification failed."
            );
          }
        },

        // ========================================
        // PAYMENT MODAL CLOSED
        // ========================================

        modal: {
                   ondismiss: async function () {
            if (paymentHandled) return;

            const h = holdRef.current;

            try {
              if (h) {
                const res = await fetch(
                  `${API_BASE}/api/appointments/holds/payment-cancelled`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-verify-token": verifyToken,
                    },
                    body: JSON.stringify({
                      holdId: h.holdId,
                      holdToken: h.holdToken,
                    }),
                  }
                );
                const data = await res.json();

                if (data.released) {
                  saveHold(null);
                  setForm((prev) => ({ ...prev, time: "" }));
                  toast.info("Payment cancelled. Please select a time slot again.");
                  await refreshSlots();
                  return;
                }
              }
            } catch (error) {
              console.error("PAYMENT CANCEL RELEASE ERROR:", error);
            }

            toast.info(
              "Payment cancelled. Your appointment was not booked."
            );
          },
        },

        // ========================================
        // PAYMENT FAILED
        // ========================================

        retry: {
          enabled: true,
        },
      };

      if (
        typeof window.Razorpay !==
        "function"
      ) {
        toast.error(
          "Payment gateway is not loaded. Please refresh the page."
        );

        return;
      }

      const razorpay =
        new window.Razorpay(
          razorpayOptions
        );

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "RAZORPAY PAYMENT FAILED:",
            response
          );

          toast.error(
            "Payment failed. No appointment was booked."
          );
        }
      );

      razorpay.open();

    } catch (error) {
      console.error(
        "BOOK APPOINTMENT ERROR:",
        error
      );

      if (
        error.message?.includes("not available on the selected date") ||
        error.message?.includes("became unavailable")
      ) {
        refreshDoctorLeave();
      }
      if (error.message?.includes("Clinic is closed on the selected date.")) {
        refreshClinicClosureInfo();
      }

      toast.error(
        error.message ||
          "Unable to start payment."
      );
      } finally {
    paymentLockRef.current = false;
  }
  };

  /* =========================
     RESET FORM
  ========================= */

  const resetForm = () => {
    setStep(1);
    releaseHoldNow();
    setVerifyToken("");
    setSlotPool([]);
    setVerified(false);
    setOtpSent(false);
    setAvailableTimes([]);
    setBookedTimes([]);
    setDoctorLeaveInfo(emptyDoctorLeaveInfo);
    setDoctorLeaveLoading(false);
    setMedicineInterest("");
    setShowMedicinePopup(false);

    setForm({
      name: "",
      phone: "",
      otp: "",
      doctor: "",
      consultationType: "",
      treatment: "",
      date: "",
      time: "",
      address: "",
      message: "",
    });

    setAppointmentId("");

    toast.info(
      "Ready to book another appointment"
    );
  };

  return (
    <>
      <ClinicStatusBanner />

     {/* =========================
    TOP BANNER
========================= */}

<section className="apptTop">
  <div className="apptTop__inner">
    <span className="apptTop__eyebrow">
      BOOK AN APPOINTMENT
    </span>

    <h2 className="apptTop__title">
      Your skin &amp; hair care
      <br className="apptTop__br" />
      starts here
    </h2>
<div className="apptTop__chips">
  <span style={{ "--i": 0 }}>
    <b className="apptTop__tick">✓</b> Quick OTP verification
  </span>
  <span style={{ "--i": 1 }}>
    <b className="apptTop__tick">✓</b> Choose your own slot
  </span>
  <span style={{ "--i": 2 }}>
    <b className="apptTop__tick">✓</b> Secure online payment
  </span>
</div>
  </div>
</section>

      {/* =========================
          APPOINTMENT FORM
      ========================= */}

<section className="skinAppt" ref={formRef}>
          <div className="skinAppt__wrap">

          {step === 1 && (
            <div className="skinAppt__content">

              <div className="skinAppt__eyebrow">
                APPOINTMENT
              </div>

              <h1 className="skinAppt__title">
                Book your
                <br />
                consultation.
              </h1>

              <p className="skinAppt__intro">
                Tell us a little about yourself and
                <br />
                choose a convenient time to visit us.
              </p>

              <form
                className="skinAppt__form"
                onSubmit={continueToPayment}
              >

                {/* NAME */}

                <div className="skinAppt__row">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={changeHandler}
                    autoComplete="name"
                    required
                  />
                </div>

                {/* PHONE */}

                <div className="skinAppt__phone">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => {
                      const value =
                        e.target.value.replace(
                          /\D/g,
                          ""
                        );

                      if (value.length <= 10) {
                        setForm((prev) => ({
                          ...prev,
                          phone: value,
                        }));
                      }
                    }}
                    disabled={verified}
                    maxLength="10"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                  />

                  {!verified && (
                    <button
                      type="button"
                      onClick={sendOTP}
                      disabled={
                        otpCooldown > 0 ||
                        otpSending
                      }
                    >
                      {otpSending
                        ? "SENDING..."
                        : otpCooldown > 0
                        ? `RESEND OTP IN ${otpCooldown}s`
                        : "SEND OTP"}
                    </button>
                  )}
                </div>

                {/* OTP */}

                {otpSent && !verified && (
                  <div className="skinAppt__otp">
                    <input
                      type="text"
                      name="otp"
                      placeholder="Enter verification code"
                      value={form.otp}
                      onChange={(e) => {
                        const value =
                          e.target.value.replace(
                            /\D/g,
                            ""
                          );

                        if (value.length <= 6) {
                          setForm((prev) => ({
                            ...prev,
                            otp: value,
                          }));
                        }
                      }}
                      maxLength="6"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />

                    <button
                      type="button"
                      onClick={verifyOTP}
                    >
                      VERIFY
                    </button>
                  </div>
                )}

                {/* VERIFIED */}

                {verified && (
                  <div className="skinAppt__verified">
                    ✓ Phone number verified
                  </div>
                )}

                {/* DOCTOR */}

                {clinicClosureInfo.closedToday && (
                  <div className="skinAppt__leaveNotice" role="status">
                    <div className="skinAppt__noticeHeader">
                      <strong>Clinic is closed....!</strong>
                    </div>
                    {clinicClosureInfo.currentClosure && (
                      <div className="skinAppt__noticeRow">
                        <span className="skinAppt__noticeLabel">Closed:</span>
                        <span className="skinAppt__noticeValue">
                          {" "}
                          {formatNoticeDate(
                            clinicClosureInfo.currentClosure.startDate
                          )}
                          {clinicClosureInfo.currentClosure.startDate !==
                            clinicClosureInfo.currentClosure.endDate &&
                            ` - ${formatNoticeDate(
                              clinicClosureInfo.currentClosure.endDate
                            )}`}
                        </span>
                      </div>
                    )}
                    {clinicClosureInfo.currentClosure?.reason && (
                      <div className="skinAppt__noticeRow">
                        <span className="skinAppt__noticeLabel">Due to:-</span>
                        <span className="skinAppt__noticeReason">
                          {clinicClosureInfo.currentClosure.reason}
                        </span>
                      </div>
                    )}
                    {clinicClosureInfo.reopenDate ? (
                      <div className="skinAppt__noticeRow">
                        <span className="skinAppt__noticeLabel">
                          Reopens on:
                        </span>
                        <span className="skinAppt__noticeDateValue">
                          {" "}
                          {new Date(
                            `${clinicClosureInfo.reopenDate}T00:00:00`
                          ).toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    ) : (
                      <div className="skinAppt__noticeRow">
                        <span>Please check back later.</span>
                      </div>
                    )}
                  </div>
                )}

                <select
                  className="skinAppt__select"
                  name="doctor"
                  value={form.doctor}
                  onChange={changeHandler}
                  required
                >
                  <option value="">
                    {doctorLoading
                      ? "Finding available doctors..."
                      : "Choose your doctor"}
                  </option>

                  {doctors.map((doctor) => (
                    <option
                      key={doctor._id}
                      value={doctor.name}
                    >
                      {doctor.name}

                      {doctor.specialization
                        ? ` - ${doctor.specialization}`
                        : ""}
                    </option>
                  ))}
                </select>

                {!clinicClosureLoading &&
                  !clinicClosureInfo.closedToday &&
                  doctorLeaveInfo.onLeaveToday && (
                  <div className="skinAppt__leaveNotice" role="status">
                    <div className="skinAppt__noticeHeader">
                      <strong>Dr. {form.doctor} is not available</strong>
                    </div>
                    {doctorLeaveInfo.currentLeave && (
                      <div className="skinAppt__noticeRow">
                        <span className="skinAppt__noticeLabel">
                          Unavailable:
                        </span>
                        <span className="skinAppt__noticeValue">
                          {" "}
                          {formatNoticeDate(
                            doctorLeaveInfo.currentLeave.startDate
                          )}
                          {doctorLeaveInfo.currentLeave.startDate !==
                            doctorLeaveInfo.currentLeave.endDate &&
                            ` - ${formatNoticeDate(
                              doctorLeaveInfo.currentLeave.endDate
                            )}`}
                        </span>
                      </div>
                    )}
                    {doctorLeaveInfo.currentLeave?.reason && (
                      <div className="skinAppt__noticeRow">
                        {/* <span className="skinAppt__noticeLabel">Due to:-</span>
                        <span className="skinAppt__noticeReason">
                          {doctorLeaveInfo.currentLeave.reason}
                        </span> */}
                      </div>
                    )}
                    {doctorLeaveInfo.nextAvailableDate ? (
                      <div className="skinAppt__noticeRow">
                        <span className="skinAppt__noticeLabel">
                          Next available date:
                        </span>
                        <span className="skinAppt__noticeDateValue">
                          {" "}
                          {new Date(
                            `${doctorLeaveInfo.nextAvailableDate}T00:00:00`
                          ).toLocaleDateString("en-IN", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    ) : (
                      <div className="skinAppt__noticeRow">
                        <span>Please choose another doctor.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* CONSULTATION TYPE */}

                <select
                  className="skinAppt__select"
                  name="consultationType"
                  value={form.consultationType}
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setForm((prev) => ({
                      ...prev,

                      consultationType:
                        value,

                      /*
                        Treatment is required
                        ONLY for Procedure.
                      */

                      treatment:
                        value === "procedure"
                          ? prev.treatment
                          : "",
                    }));
                      if (value === "procedure") {
                         setShowTokenPopup(true);
                       }
                       if (value === "procedure") {
  setShowTokenPopup(true);
}
if (value === "video") {
  setShowVideoPopup(true);
}
                  }}
                  required
                >
                  <option value="">
                    Choose consultation type
                  </option>

                  <option value="clinic">
                    In-Person Consultation — ₹
                    {consultationFees.clinicFee}
                  </option>

                  <option value="video">
                    Video Consultation — ₹
                    {consultationFees.videoFee}
                  </option>

                  <option value="procedure">
  Procedure (Token Money) — ₹{consultationFees.procedureFee}
</option>
                </select>

                {/* =========================
                    TREATMENT
                    ONLY FOR PROCEDURE
                ========================= */}

                {form.consultationType ===
                  "procedure" && (
                  <select
                    className="skinAppt__select"
                    name="treatment"
                    value={form.treatment}
                    onChange={changeHandler}
                    required
                  >
                    {form.treatment &&
  ![/* existing options ke values yahan hain */].includes(form.treatment) && (
    <option value={form.treatment}>
      {form.treatment}
    </option>
)}
                    <option value="">
                      Select your treatment
                    </option>

                    <option value="PRP Therapy for Hair Growth">
                      PRP Therapy for Hair Growth
                    </option>

                    <option value="GFC Therapy for Hair Growth">
                      GFC Therapy for Hair Growth
                    </option>

                    <option value="Meso Therapy for Hair Growth">
                      Meso Therapy for Hair Growth
                    </option>

                    <option value="Analogous Serum Therapy for Allergy">
                      Analogous Serum Therapy for Allergy
                    </option>

                    <option value="Skin Biopsy for Chronic Disease">
                      Skin Biopsy for Chronic Disease
                    </option>

                    <option value="Hydra Facial">
                      Hydra Facial
                    </option>

                    <option value="Oxygenio Facial">
                      Oxygenio Facial
                    </option>

                    <option value="Chemical Peel for Melasma">
                      Chemical Peel for Melasma
                    </option>

                    <option value="Chemical Peel for Acne">
                      Chemical Peel for Acne
                    </option>

                    <option value="RF Therapy for Skin Tags & Warts">
                      RF Therapy for Skin Tags & Warts
                    </option>

                    <option value="RF Therapy for Mole Removal">
                      RF Therapy for Mole Removal
                    </option>

                    <option value="CO₂ Laser for Scar Treatment">
                      CO₂ Laser for Scar Treatment
                    </option>

                    <option value="CO₂ Laser for Keloid Treatment">
                      CO₂ Laser for Keloid Treatment
                    </option>

                    <option value="CO₂ Laser for Skin Rejuvenation">
                      CO₂ Laser for Skin Rejuvenation
                    </option>

                    <option value="CO₂ Laser for Skin Tags & Warts">
                      CO₂ Laser for Skin Tags & Warts
                    </option>

                    <option value="4-Wavelength Laser Hair Reduction">
                      4-Wavelength Laser Hair Reduction
                    </option>

                    <option value="Carbon Laser Treatment – Hollywood Peel">
                      Carbon Laser Treatment – Hollywood Peel
                    </option>

                    <option value="Q-Switch Laser for Melasma">
                      Q-Switch Laser for Melasma
                    </option>

                    <option value="Q-Switch Laser for Glow Toning">
                      Q-Switch Laser for Glow Toning
                    </option>

                    <option value="Q-Switch Laser for Tattoo Removal">
                      Q-Switch Laser for Tattoo Removal
                    </option>

                    <option value="Dermaplaning & Dermabrasion">
                      Dermaplaning & Dermabrasion
                    </option>

                    <option value="Blackheads & Whiteheads Treatment">
                      Blackheads & Whiteheads Treatment
                    </option>

                    <option value="Full Body Laser Hair Reduction">
                      Full Body Laser Hair Reduction
                    </option>

                    <option value="Nail Surgery">
                      Nail Surgery
                    </option>

                    <option value="Dermoscopy for Hair Loss Diagnosis">
                      Dermoscopy for Hair Loss Diagnosis
                    </option>

                    <option value="Dermoscopy for Skin Diseases Diagnosis">
                      Dermoscopy for Skin Diseases Diagnosis
                    </option>

                    <option value="Alopecia Areata Treatment">
                      Alopecia Areata Treatment
                    </option>

                    <option value="Chronic Skin Diseases Treatment">
                      Chronic Skin Diseases Treatment
                    </option>

                    <option value="Pediatric Dermatology">
                      Pediatric Dermatology
                    </option>

                    <option value="Geriatric Dermatology">
                      Geriatric Dermatology
                    </option>

                    <option value="MNRF Treatment for Acne Scar Reduction">
                      MNRF Treatment for Acne Scar Reduction
                    </option>

                    <option value="MNRF Treatment for Skin Rejuvenation">
                      MNRF Treatment for Skin Rejuvenation
                    </option>

                    <option value="MNRF Treatment for Fine Lines and Open Pores">
                      MNRF Treatment for Fine Lines and Open Pores
                    </option>

                    <option value="Hesitation Cut Marks Treatment">
                      Hesitation Cut Marks Treatment
                    </option>

                    <option value="Ear Lobe Repair">
                      Ear Lobe Repair
                    </option>

                    <option value="Ear Piercing">
                      Ear Piercing
                    </option>

                    <option value="Nose Piercing">
                      Nose Piercing
                    </option>

                    <option value="Bikini & Underarms Hair Reduction Laser">
                      Bikini & Underarms Hair Reduction Laser
                    </option>

                    <option value="Vitiligo Treatment">
                      Vitiligo Treatment
                    </option>

                    <option value="Sexually Transmitted Disease Treatment">
                      Sexually Transmitted Disease Treatment
                    </option>

                    <option value="Consultation Free for Senior Citizens & Armed Forces">
                      Consultation Free for Senior Citizens & Armed Forces
                    </option>

                    <option value="Glutathione Treatment for Skin Glow">
                      Glutathione Treatment for Skin Glow
                    </option>
                  </select>
                )}

                {/* ADDRESS */}

                <input
                  type="text"
                  name="address"
                  placeholder="Your address (optional)"
                  value={form.address}
                  onChange={changeHandler}
                  autoComplete="street-address"
                />

                {/* DATE + TIME */}

                <div className="skinAppt__row">
                  <AppointmentCalendar
                    value={form.date}
                    onSelect={(value) =>
                      handleDateChange({ target: { value } })
                    }
                    isDateDisabled={(dateString) =>
                      dateString < getTodayDate() ||
                      clinicClosureInfo.closures.some(
                        (closure) =>
                          dateString >= closure.startDate &&
                          dateString <= closure.endDate
                      ) ||
                      doctorLeaveInfo.leaves.some(
                        (leave) =>
                          dateString >= leave.startDate &&
                          dateString <= leave.endDate
                      )
                    }
                    disabled={
                      doctorLeaveLoading || clinicClosureLoading
                    }
                    legendText={
                      doctorLeaveInfo.leaves.length ||
                      clinicClosureInfo.closures.length
                        ? "Greyed dates: clinic closed or doctor not available"
                        : ""
                    }
                  />

                  <select
                    name="time"
                    value={form.time}
                                        onChange={handleTimeChange}
                    required
                    disabled={
                      !form.date ||
                      loadingSchedule ||
                      availableTimes.length === 0
                    }
                  >
                    <option value="">
                      {!form.date
                        ? "Choose date first"
                        : loadingSchedule
                        ? "Finding available slots..."
                        : availableTimes.length ===
                          0
                        ? "No slots available"
                        : "Choose appointment time"}
                    </option>

                    {availableTimes.map((time) => (
                      <option
                        key={time.value}
                        value={time.value}
                      >
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>

                {hold && form.time && holdSecondsLeft > 0 && (
                  <div className="appointment-day-message">
                    <p>
                      Slot reserved for you:{" "}
                      <strong>
                        {Math.floor(holdSecondsLeft / 60)}:
                        {String(holdSecondsLeft % 60).padStart(2, "0")}
                      </strong>
                    </p>
                  </div>
                )}

                {/* DAY MESSAGE */}

                {form.date && (
                  <div className="appointment-day-message">
                    {loadingSchedule ? (
                      <p>
                        Checking clinic availability...
                      </p>
                    ) : !selectedDaySchedule ? (
                      <p>
                        Clinic schedule is not available.
                      </p>
                    ) : !selectedDaySchedule.enabled ? (
                      <p>
                        Clinic is closed on{" "}
                        <strong>
                          {selectedDay}
                        </strong>
                        .
                      </p>
                    ) : availableTimes.length ===
                      0 ? (
                      <p>
                        All appointments for{" "}
                        <strong>
                          {selectedDay}
                        </strong>{" "}
                        are booked.
                      </p>
                    ) : (
                      <p>
                        Appointment slots available
                        for{" "}
                        <strong>
                          {selectedDay}
                        </strong>
                        .
                      </p>
                    )}
                  </div>
                )}

                {/* MESSAGE */}

                <textarea
                  name="message"
                  rows="4"
                  placeholder="Anything you'd like to share with us? (optional)"
                  value={form.message}
                  onChange={changeHandler}
                />

                {/* SUBMIT */}

                <button
                  type="submit"
                  className="skinAppt__submit"
                >
                  <span>
                    Proceed to Payment →
                  </span>
                </button>

                {/* FEE */}

                <div className="skinAppt__feeNote">
                  Appointment booking fee:

                  <strong>
                    {" "}

                 {form.consultationType === "clinic"
  ? `₹${consultationFees.clinicFee}`
  : form.consultationType === "video"
  ? `₹${consultationFees.videoFee}`
  : form.consultationType === "procedure"
  ? `₹${consultationFees.procedureFee}`
  : "Choose consultation"}
                  </strong>
                </div>
              </form>
            </div>
          )}

          {/* =========================
              SUCCESS
          ========================= */}

          {step === 3 && (
            <div className="skinAppt__content skinAppt__success">

              <div className="skinAppt__successIcon">
                ✓
              </div>

              <div className="skinAppt__eyebrow">
                DETAILS SUBMITTED SUCCESSFULLY
              </div>

              <h1 className="skinAppt__title">
                Your booking is
                <br />
                confirmed.
              </h1>

              <p className="skinAppt__intro">
                Your payment was successful and your appointment
                details have been submitted successfully.
                <br />
                Our team will contact you shortly with the
                appointment details.
              </p>

              <div className="skinAppt__successInfo">

                <span>
                  APPOINTMENT ID
                </span>

                <strong>
                  {appointmentId}
                </strong>

                <small>
                  Doctor: {form.doctor}
                </small>

                <small>
                  Consultation:{" "}
                  {form.consultationType === "clinic"
                    ? "In-Person Consultation"
                    : form.consultationType === "video"
                    ? "Video Consultation"
                    : "Procedure"}
                </small>

                {form.consultationType ===
                  "procedure" &&
                  form.treatment && (
                    <small>
                      Procedure:{" "}
                      {form.treatment}
                    </small>
                  )}

                <small>
                  Date: {form.date}
                </small>

                <small>
                  Time: {form.time}
                </small>

                <small>
                  Booking fee:{" "}
                  {form.consultationType === "clinic"
                    ? `₹${consultationFees.clinicFee}`
                    : form.consultationType === "video"
                    ? `₹${consultationFees.videoFee}`
                    : "As applicable"}
                </small>
              </div>

              <button
                type="button"
                className="skinAppt__submit"
                onClick={resetForm}
              >
                BOOK ANOTHER APPOINTMENT

                <span>+</span>
              </button>
            </div>
          )}

          {/* =========================
              RIGHT VISUAL
          ========================= */}

          <div className="skinAppt__visual">

            <img
              src={app}
              alt="Skin consultation"
            />

            <div className="skinAppt__info">

              <span>
                CLINIC HOURS
              </span>

              {loadingSchedule ? (
                <strong>
                  Loading...
                </strong>
              ) : (
                <>
                  <strong>
                    Monday – Sunday
                  </strong>

                  <p>
                    Timings are managed by admin.
                  </p>
                </>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* =========================
          MEDICINE POPUP
      ========================= */}

      {showMedicinePopup && (
        <div className="medicine-popup-overlay">

          <div className="medicine-popup">

            <button
              type="button"
              className="medicine-popup-close"
              onClick={() =>
                setShowMedicinePopup(false)
              }
            >
              ×
            </button>

            <div className="medicine-popup-icon">
              +
            </div>

            <span className="medicine-popup-eyebrow">
              VIDEO CONSULTATION
            </span>

            <h2>
              Are you interested in
              <br />
              getting medicines?
            </h2>

            <p>
              If prescribed by the doctor, would you
              be interested in getting your medicines
              delivered to you?
            </p>

            <div className="medicine-popup-options">

              <button
                type="button"
                className={
                  medicineInterest === "yes"
                    ? "medicine-option active"
                    : "medicine-option"
                }
                onClick={() =>
                  setMedicineInterest("yes")
                }
              >
                <span className="medicine-option-radio">
                  {medicineInterest === "yes"
                    ? "✓"
                    : ""}
                </span>

                <span>
                  Yes, I'm interested
                </span>
              </button>

              <button
                type="button"
                className={
                  medicineInterest === "no"
                    ? "medicine-option active"
                    : "medicine-option"
                }
                onClick={() =>
                  setMedicineInterest("no")
                }
              >
                <span className="medicine-option-radio">
                  {medicineInterest === "no"
                    ? "✓"
                    : ""}
                </span>

                <span>
                  No, not interested
                </span>
              </button>

              <button
                type="button"
                className={
                  medicineInterest === "later"
                    ? "medicine-option active"
                    : "medicine-option"
                }
                onClick={() =>
                  setMedicineInterest("later")
                }
              >
                <span className="medicine-option-radio">
                  {medicineInterest === "later"
                    ? "✓"
                    : ""}
                </span>

                <span>
                  Decide after consultation
                </span>
              </button>

            </div>

            <button
              type="button"
              className="medicine-popup-continue"
              disabled={!medicineInterest}
              onClick={() =>
                bookAppointment(
                  medicineInterest
                )
              }
            >
              Continue to Book Appointment
              <span>→</span>
            </button>

            <small className="medicine-popup-note">
              This preference helps our team assist you
              better after your consultation.
            </small>

          </div>
        </div>
      )}
      {/* =========================
    TOKEN MONEY POPUP
========================= */}

{showTokenPopup && (
  <div className="medicine-popup-overlay">
    <div className="medicine-popup">
      <button
        type="button"
        className="medicine-popup-close"
        onClick={() => setShowTokenPopup(false)}
      >
        ×
      </button>

      <div className="medicine-popup-icon">₹</div>

      <span className="medicine-popup-eyebrow">
        PROCEDURE BOOKING
      </span>

      <h2>
        This is a token amount,
        <br />
        not the full fee.
      </h2>

      <p>
        To confirm your procedure slot, you pay a token
        amount
        {consultationFees.procedureFee
          ? ` of ₹${consultationFees.procedureFee}`
          : ""}
        . This amount will be adjusted in your final
        treatment cost. The final cost of the procedure
        will be decided by the doctor after examination.
          </p>

      {/* GST NOTICE - YAHAN ADD KARO */}
      <div
        style={{
          margin: "14px 0",
          padding: "10px 12px",
          background: "#fff1f1",
          border: "1px solid #f0bcbc",
          borderRadius: "8px",
          color: "#c62828",
          fontSize: "12px",
          lineHeight: "1.5",
          fontWeight: 600,
        }}
      >
        GST @ 5%  may apply to eligible beauty
        and physical well-being services, as per applicable
        Government of India GST rules.
      </div>

      <button
        type="button"
        className="medicine-popup-continue"
        onClick={() => setShowTokenPopup(false)}
      >
        I Understand
        <span>→</span>
      </button>

      <small className="medicine-popup-note">
        You can continue filling the form after this.
      </small>
    </div>
  </div>
)}
{showVideoPopup && (
  <div className="medicine-popup-overlay">
    <div className="medicine-popup">
      <button
        type="button"
        className="medicine-popup-close"
        onClick={() => setShowVideoPopup(false)}
      >
        ×
      </button>

      <div className="medicine-popup-icon">i</div>

      <span className="medicine-popup-eyebrow">
        VIDEO CONSULTATION
      </span>

     <h2>Please note</h2>

<p>
  We offer video consultation only for your convenience. We do not
  promote it, and it cannot replace a physical examination.
</p>

<p>
  We advise you to also consult or get examined by a doctor near you.
</p>

      <button
        type="button"
        className="medicine-popup-continue"
        onClick={() => setShowVideoPopup(false)}
      >
        I Understand
        <span>→</span>
      </button>

      <small className="medicine-popup-note">
        You can continue filling the form after this.
      </small>
    </div>
  </div>
)}
    </>
  );
};

export default Appointment;
