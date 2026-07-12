import React, { useState } from 'react';
import axios from 'axios';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

const MaintenanceTable = ({ requests, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const filteredRequests = requests.filter(r => {
    const matchesSearch = (r.assetId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (r.issueDescription || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? r.status === statusFilter : true;
    const matchesPriority = priorityFilter ? r.priority === priorityFilter : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance request?')) return;
    try {
      await axios.delete(`/api/maintenance/${id}`);
      onRefresh();
    } catch (err) {
      alert('Failed to delete request');
    }
  };

  const assignTechnician = async (id) => {
    const techName = window.prompt("Enter Technician Name:");
    if (!techName) return;
    
    try {
      await axios.put(`/api/maintenance/${id}`, { technician: techName, status: 'Technician Assigned' });
      onRefresh();
    } catch (err) {
      alert('Failed to assign technician');
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <input 
          type="text"
          placeholder="Search asset or issue..."
          className="bg-gray-950 border border-gray-700 rounded-md px-4 py-2 text-sm text-white w-full md:w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-4">
          <select 
            className="bg-gray-950 border border-gray-700 rounded-md px-4 py-2 text-sm text-white w-full md:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Technician Assigned">Technician Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select 
            className="bg-gray-950 border border-gray-700 rounded-md px-4 py-2 text-sm text-white w-full md:w-40"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs text-gray-500 uppercase bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3">Asset</th>
              <th className="px-6 py-3">Issue</th>
              <th className="px-6 py-3">Priority</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Technician</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length > 0 ? filteredRequests.map((req) => (
              <tr key={req._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-gray-200">
                  {req.assetId?.name || 'Unknown Asset'}
                </td>
                <td className="px-6 py-4 truncate max-w-xs">{req.issueDescription}</td>
                <td className="px-6 py-4"><PriorityBadge priority={req.priority} /></td>
                <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                <td className="px-6 py-4">{req.technician || <span className="text-gray-600">Unassigned</span>}</td>
                <td className="px-6 py-4 text-right">
                  {req.status === 'Approved' && (
                    <button 
                      onClick={() => assignTechnician(req._id)}
                      className="text-blue-500 hover:text-blue-400 mr-4"
                    >
                      Assign Tech
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(req._id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No maintenance requests found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceTable;