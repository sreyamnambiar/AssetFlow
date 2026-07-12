import React from 'react';
import StatusBadge from './StatusBadge';

const BookingTable = ({ bookings, onDelete }) => {
  if (!bookings || bookings.length === 0) {
    return <div className="p-4 text-center text-gray-500 bg-gray-900 rounded-lg border border-gray-800">No bookings found.</div>;
  }

  return (
    <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-800">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-gray-800/50 border-b border-gray-800">
          <tr>
            <th className="px-6 py-3">Asset</th>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Time</th>
            <th className="px-6 py-3">Purpose</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
              <td className="px-6 py-4 font-medium text-gray-200">{booking.assetId?.name || 'Unknown Asset'}</td>
              <td className="px-6 py-4">{booking.bookingDate}</td>
              <td className="px-6 py-4">{booking.startTime} - {booking.endTime}</td>
              <td className="px-6 py-4">{booking.purpose}</td>
              <td className="px-6 py-4">
                <StatusBadge status={booking.status} />
              </td>
              <td className="px-6 py-4 text-right">
                <button 
                  onClick={() => onDelete && onDelete(booking._id)}
                  className="text-red-500 hover:text-red-400 font-medium text-xs bg-red-900/20 px-3 py-1 rounded"
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookingTable;