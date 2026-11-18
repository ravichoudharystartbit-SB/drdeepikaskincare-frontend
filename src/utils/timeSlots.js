export const generateTimeSlots = (startOrSessions, end) => {
  const slots = [];

  let sessions = [];

  /*
    New format:
    generateTimeSlots([
      { startTime: "10:30", endTime: "14:00" },
      { startTime: "16:00", endTime: "19:30" }
    ])
  */

  if (Array.isArray(startOrSessions)) {
    sessions = startOrSessions;
  } else {
    /*
      Old format:
      generateTimeSlots("10:30", "19:30")
    */

    if (startOrSessions && end) {
      sessions = [
        {
          startTime: startOrSessions,
          endTime: end,
        },
      ];
    }
  }

  if (!sessions.length) return slots;

  sessions.forEach((session) => {
    const start = session?.startTime;
    const finish = session?.endTime;

    if (!start || !finish) return;

    const [startHour, startMinute] = start
      .split(":")
      .map(Number);

    const [endHour, endMinute] = finish
      .split(":")
      .map(Number);

    let currentMinutes =
      startHour * 60 + startMinute;

    const endMinutes =
      endHour * 60 + endMinute;

    while (currentMinutes < endMinutes) {
      const hour = Math.floor(
        currentMinutes / 60
      );

      const minute = currentMinutes % 60;

      const timeValue = `${String(hour).padStart(
        2,
        "0"
      )}:${String(minute).padStart(2, "0")}`;

      const displayHour = hour % 12 || 12;

      const ampm = hour >= 12 ? "PM" : "AM";

      const displayTime = `${displayHour}:${String(
        minute
      ).padStart(2, "0")} ${ampm}`;

      slots.push({
        value: timeValue,
        label: displayTime,
      });

      /*
        IMPORTANT:
        Slot interval = 7 minutes
      */
      currentMinutes += 7;
    }
  });

  return slots;
};