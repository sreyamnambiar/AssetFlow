export function normalizeTime(value) {
  if (!value) return value;
  const [hours, minutes] = value.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

export function getBookingStatus(booking, now = new Date()) {
  if (booking.status === 'cancelled') {
    return 'cancelled';
  }

  const start = new Date(`${booking.bookingDate}T${normalizeTime(booking.startTime)}:00`);
  const end = new Date(`${booking.bookingDate}T${normalizeTime(booking.endTime)}:00`);

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  if (now > end) return 'completed';
  return booking.status || 'upcoming';
}

export function isFutureSlot(bookingDate, startTime, now = new Date()) {
  const slotStart = new Date(`${bookingDate}T${normalizeTime(startTime)}:00`);
  return slotStart.getTime() >= now.getTime();
}

export function toDateKey(value) {
  const date = new Date(value);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10);
}