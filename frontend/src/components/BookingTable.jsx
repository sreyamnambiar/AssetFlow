import React, { useState } from 'react';
import axios from 'axios';
import StatusBadge from './StatusBadge';

const BookingTable = ({ bookings, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = (b.assetId?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? b.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await axios.put(`/api/bookings/${id}`, { status: 'cancelled' });
      onRefresh();
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record entirely?')) return;
    try {
      await axios.delete(`/api/bookings/${id}`);
      onRefresh();
    } catch (err) {
      alert('Failed to delete booking');
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <input 
          type="text"
          placeholder="Search by resource name..."
          className="bg-gray-950 border border-gray-700 rounded-md px-4 py-2 text-sm text-white w-full md:w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="bg-gray-950 border border-gray-700 rounded-md px-4 py-2 text-sm text-white w-full md:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs text-gray-500 uppercase bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3">Resource</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
              <tr key={booking._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-gray-200">
                  {booking.assetId?.name || 'Unknown Asset'}
                </td>
                <td className="px-6 py-4">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">{booking.startTime} - {booking.endTime}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  {booking.status === 'upcoming' && (
                    <button 
                      onClick={() => handleCancel(booking._id)}
                      className="text-yellow-500 hover:text-yellow-400 mr-4"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(booking._id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No bookings found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingTable;