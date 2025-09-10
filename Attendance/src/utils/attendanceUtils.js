// Convert "HH:MM" → minutes
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Check if a Date object is inside a slot
const isInSlot = (date, slot) => {
  const mins = date.getHours() * 60 + date.getMinutes();
  return mins >= timeToMinutes(slot.start) && mins <= timeToMinutes(slot.end);
};

// Keep only the first attendance in each slot
const filterBySlots = (timestamps, slots) => {
  const kept = [];
  slots.forEach((slot) => {
    const inSlot = timestamps
      .map((ts) => new Date(ts))
      .filter((d) => isInSlot(d, slot));
    if (inSlot.length > 0) {
      const earliest = inSlot.reduce((a, b) => (a < b ? a : b));
      kept.push(earliest.toISOString());
    }
  });
  return kept;
};

export { filterBySlots };