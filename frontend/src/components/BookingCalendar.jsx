import React from 'react';

const BookingCalendar = ({ bookings, newBooking }) => {
  // Generate time slots from 9:00 AM to 5:00 PM
  const timeSlots = Array.from({ length: 9 }, (_, i) => i + 9);

  // Helper to calculate position and height based on time strings "HH:mm"
  const getStyleForTime = (startTime, endTime) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    // Assume timeline starts at 9:00 AM, each hour is 60px
    const top = ((startH - 9) * 60) + startM;
    const height = ((endH - startH) * 60) + (endM - startM);
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      position: 'absolute',
      width: 'calc(100% - 60px)',
      left: '60px',
    };
  };

  const isConflict = (startTime, endTime) => {
    if (!startTime || !endTime) return false;
    return bookings.some(b => 
      b.status !== 'cancelled' &&
      startTime < b.endTime && 
      endTime > b.startTime
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 text-gray-300 relative border border-gray-700 h-[calc(100vh-240px)] overflow-y-auto">
      <div className="relative" style={{ height: '540px' }}>
        {/* Render Time Slots Background */}
        {timeSlots.map((hour) => (
          <div key={hour} className="flex border-b border-gray-800 h-[60px]">
            <div className="w-[60px] text-sm text-gray-500 pr-2 pt-1 border-r border-gray-800">
              {hour}:00
            </div>
            <div className="flex-1"></div>
          </div>
        ))}

        {/* Render Existing Bookings */}
        {bookings.map((booking) => (
          <div 
            key={booking._id}
            style={getStyleForTime(booking.startTime, booking.endTime)}
            className="bg-blue-900/60 border border-blue-500 rounded-md p-2 text-sm text-blue-100 overflow-hidden flex flex-col justify-center"
          >
            <span>Booked - {booking.purpose} - {booking.startTime} to {booking.endTime}</span>
          </div>
        ))}

        {/* Render New Booking Preview if any */}
        {newBooking?.startTime && newBooking?.endTime && (
          <div 
            style={getStyleForTime(newBooking.startTime, newBooking.endTime)}
            className={`border-2 border-dashed rounded-md p-2 text-sm flex flex-col justify-center
              ${isConflict(newBooking.startTime, newBooking.endTime) 
                ? 'bg-red-900/20 border-red-500 text-red-300 z-10' 
                : 'bg-green-900/20 border-green-500 text-green-300 z-10'}`}
          >
            {isConflict(newBooking.startTime, newBooking.endTime) 
              ? <span>Requested {newBooking.startTime} to {newBooking.endTime} - conflict - slot is unavailable</span>
              : <span>Requested {newBooking.startTime} to {newBooking.endTime} - slot available</span>
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCalendar;