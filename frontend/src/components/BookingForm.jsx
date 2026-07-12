import React, { useState } from 'react';

const BookingForm = ({ 
  assets, 
  selectedAsset, 
  selectedDate, 
  onAssetChange, 
  onDateChange, 
  onChange, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    purpose: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...formData, [name]: value };
    setFormData(newForm);
    onChange({ ...newForm, assetId: selectedAsset, bookingDate: selectedDate });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, assetId: selectedAsset, bookingDate: selectedDate });
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Book a Resource</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Resource (Asset)</label>
          <select 
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-green-500"
            value={selectedAsset}
            onChange={(e) => onAssetChange(e.target.value)}
            required
          >
            <option value="">Select Resource</option>
            {assets.map(asset => (
              <option key={asset._id} value={asset._id}>{asset.name} ({asset.assetCode})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
          <input 
            type="date"
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-green-500"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
            <input 
              type="time"
              name="startTime"
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-green-500"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">End Time</label>
            <input 
              type="time"
              name="endTime"
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-green-500"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Purpose</label>
          <input 
            type="text"
            name="purpose"
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-green-500"
            value={formData.purpose}
            onChange={handleChange}
            placeholder="e.g. Client Meeting"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={!selectedAsset || !selectedDate || !formData.startTime || !formData.endTime || !formData.purpose}
          className="w-full bg-green-900 hover:bg-green-800 text-green-100 border border-green-700 font-medium py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Book a slot
        </button>
      </form>
    </div>
  );
};

export default BookingForm;