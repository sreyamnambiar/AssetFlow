import React from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

const MaintenanceTable = ({ requests, onDelete }) => {
  if (!requests || requests.length === 0) {
    return <div className="p-4 text-center text-gray-500 bg-gray-900 rounded-lg border border-gray-800">No maintenance requests found.</div>;
  }

  return (
    <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-800">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-gray-800/50 border-b border-gray-800">
          <tr>
            <th className="px-6 py-3">Asset Code</th>
            <th className="px-6 py-3">Issue</th>
            <th className="px-6 py-3">Priority</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Technician</th>
            <th className="px-6 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request._id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
              <td className="px-6 py-4 font-medium text-gray-200">{request.assetId?.assetCode || 'N/A'}</td>
              <td className="px-6 py-4">{request.issueDescription}</td>
              <td className="px-6 py-4">
                <PriorityBadge priority={request.priority} />
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={request.status} />
              </td>
              <td className="px-6 py-4">{request.technician || 'Unassigned'}</td>
              <td className="px-6 py-4 text-right">
                <button 
                  onClick={() => onDelete && onDelete(request._id)}
                  className="text-red-500 hover:text-red-400 font-medium text-xs bg-red-900/20 px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MaintenanceTable;