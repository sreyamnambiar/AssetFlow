import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'resolved':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_use':
      case 'ongoing':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_maintenance':
      case 'technician assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unavailable':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      case 'upcoming':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'approved':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(status)}`}>
      {status ? status.replace('_', ' ') : 'Unknown'}
    </span>
  );
};

export default StatusBadge;