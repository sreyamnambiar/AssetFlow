import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MaintenanceTimeline from '../components/MaintenanceTimeline';
import MaintenanceForm from '../components/MaintenanceForm';

const MaintenancePage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [assets, setAssets] = useState([]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/maintenance');
      setRequests(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Fetch mock assets for the form
    axios.get('/api/assets').then(res => setAssets(res.data)).catch(() => {
      setAssets([
        { _id: '64a7f9b8c2d1e4f3a5b6c7d1', name: 'Conference Room A1', assetCode: 'RM-A1', status: 'available' },
        { _id: '64a7f9b8c2d1e4f3a5b6c7d2', name: 'Conference Room B2', assetCode: 'RM-B2', status: 'available' },
        { _id: '64a7f9b8c2d1e4f3a5b6c7d3', name: 'Projector', assetCode: 'AF-0062', status: 'available' }
      ]);
    });
  }, []);

  const handleCreateRequest = async (formData) => {
    try {
      await axios.post('/api/maintenance', formData);
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create request');
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await axios.put(`/api/maintenance/${requestId}`, { status: newStatus });
      fetchRequests(); // Refresh the board
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="p-6 bg-gray-950 h-full text-gray-200 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Maintenance Management</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-green-900 hover:bg-green-800 text-green-100 border border-green-700 py-2 px-4 rounded-md"
        >
          {showForm ? 'Cancel' : '+ New Request'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <MaintenanceForm 
            assets={assets} 
            onSubmit={handleCreateRequest} 
            onCancel={() => setShowForm(false)} 
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 bg-red-900/20 p-4 rounded-md">{error}</div>
      ) : (
        <MaintenanceTimeline requests={requests} onStatusChange={handleStatusChange} />
      )}
      <div className="mt-4 text-sm text-gray-500">
        Approving a card moves the asset to under maintenance, resolving return it to availble
      </div>
    </div>
  );
};

export default MaintenancePage;