import React, { useState } from 'react';

const MaintenanceForm = ({ assets, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    assetId: '',
    issueDescription: '',
    priority: 'Low',
    image: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Raise Maintenance Request</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Asset</label>
          <select 
            name="assetId"
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-indigo-500"
            value={formData.assetId}
            onChange={handleChange}
            required
          >
            <option value="">Select Asset</option>
            {assets?.map(asset => (
              <option key={asset._id} value={asset._id}>{asset.name} ({asset.assetCode})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Issue Description</label>
          <textarea 
            name="issueDescription"
            rows="3"
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-indigo-500"
            value={formData.issueDescription}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
          <select 
            name="priority"
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-indigo-500"
            value={formData.priority}
            onChange={handleChange}
            required
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Image URL (Optional)</label>
          <input 
            type="text"
            name="image"
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-indigo-500"
            value={formData.image}
            onChange={handleChange}
          />
        </div>

        <div className="flex space-x-3 pt-2">
          <button 
            type="submit" 
            disabled={!formData.assetId || !formData.issueDescription}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
          >
            Submit Request
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm;