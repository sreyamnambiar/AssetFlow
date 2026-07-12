const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export default function BookingCalendar({ bookings = [], selectedDate, selectedResource, onBookSlot }) {
  const minMinutes = timeToMinutes('09:00');
  const maxMinutes = timeToMinutes('18:00');
  const rangeMinutes = maxMinutes - minMinutes;

  const dayBookings = bookings.filter((booking) => booking.bookingDate === selectedDate && `${booking.assetId?._id || booking.assetId}` === `${selectedResource}` && booking.status !== 'cancelled');

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="handwriting text-3xl text-white">Calendar / Timeline View</h3>
          <p className="mt-1 text-sm text-white/55">Daily schedule for the selected resource.</p>
        </div>
        <button type="button" onClick={onBookSlot} className="rounded-2xl border border-emerald-400/30 bg-emerald-900/70 px-4 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-800">Book a slot</button>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f]">
        <div className="grid grid-cols-[72px_1fr]">
          <div className="border-r border-white/10">
            {HOURS.map((hour) => (
              <div key={hour} className="flex h-14 items-start justify-end px-3 pt-2 text-sm text-white/65">
                {hour.replace(':00', '')}:00
              </div>
            ))}
          </div>

          <div className="relative">
            {HOURS.map((hour) => (
              <div key={hour} className="h-14 border-b border-dashed border-white/10" />
            ))}

            {dayBookings.length ? dayBookings.map((booking) => {
              const top = ((timeToMinutes(booking.startTime) - minMinutes) / rangeMinutes) * (HOURS.length * 56);
              const height = ((timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime)) / rangeMinutes) * (HOURS.length * 56);
              const overlap = dayBookings.some((other) => other._id !== booking._id && timeToMinutes(other.startTime) < timeToMinutes(booking.endTime) && timeToMinutes(other.endTime) > timeToMinutes(booking.startTime));

              return (
                <div key={booking._id} className={`absolute left-4 right-4 rounded-2xl border px-4 py-3 text-sm shadow-lg ${overlap ? 'border-red-300/70 bg-red-500/20 text-red-50' : 'border-sky-300/50 bg-sky-500/20 text-white'}`} style={{ top: `${top + 2}px`, height: `${Math.max(height - 4, 48)}px` }}>
                  <div className="font-semibold">{booking.assetId?.assetCode || booking.assetId?.name || 'Booked'}</div>
                  <div className="mt-1 text-xs opacity-90">{booking.purpose}</div>
                  <div className="mt-1 text-xs opacity-80">{booking.startTime} - {booking.endTime}</div>
                  {overlap ? <div className="mt-1 text-xs font-semibold uppercase tracking-wide">Conflict detected</div> : null}
                </div>
              );
            }) : (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/45">
                No bookings for this resource and date.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}