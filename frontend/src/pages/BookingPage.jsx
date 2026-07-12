import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookingCalendar from '../components/BookingCalendar';
import BookingForm from '../components/BookingForm';
import BookingTable from '../components/BookingTable';

const BookingPage = () => {
  const [assets, setAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBooking, setNewBooking] = useState(null); // Preview state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('book'); // 'book' or 'history'

  useEffect(() => {
    // Fetch bookable assets (assuming a generic endpoint or filtering logic)
    axios.get('/api/assets')
      .then(res => setAssets(res.data.filter(a => a.status === 'available' || a.status === 'in_use')))
      .catch(err => {
        console.warn('API /api/assets failed. Falling back to mock assets for demo.', err);
        setAssets([
          { _id: '64a7f9b8c2d1e4f3a5b6c7d1', name: 'Conference Room A1', assetCode: 'RM-A1', status: 'available' },
          { _id: '64a7f9b8c2d1e4f3a5b6c7d2', name: 'Conference Room B2', assetCode: 'RM-B2', status: 'available' },
          { _id: '64a7f9b8c2d1e4f3a5b6c7d3', name: 'Projector', assetCode: 'AF-0062', status: 'available' }
        ]);
      });
  }, []);

  const fetchBookings = () => {
    if (selectedAsset && selectedDate) {
      setLoading(true);
      axios.get(`/api/bookings?assetId=${selectedAsset}&bookingDate=${selectedDate}`)
        .then(res => setBookings(res.data))
        .catch(err => setError(err.response?.data?.message || err.message))
        .finally(() => setLoading(false));
    } else if (activeTab === 'history') {
      setLoading(true);
      // Fetch all bookings for history
      axios.get(`/api/bookings`)
        .then(res => setBookings(res.data))
        .catch(err => setError(err.response?.data?.message || err.message))
        .finally(() => setLoading(false));
    } else {
      setBookings([]);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedAsset, selectedDate, activeTab]);

  const handleBookingChange = (preview) => {
    setNewBooking(preview);
  };

  const handleBookSlot = async (bookingData) => {
    try {
      const res = await axios.post('/api/bookings', bookingData);
      setBookings([...bookings, res.data]);
      setNewBooking(null);
      alert('Booking created successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create booking');
    }
  };

  return (
    <div className="p-6 bg-gray-950 h-full text-gray-200 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resource Booking</h1>
        <div className="bg-gray-900 p-1 rounded-md border border-gray-800 inline-flex">
          <button 
            onClick={() => setActiveTab('book')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${activeTab === 'book' ? 'bg-green-900/30 text-green-400 font-medium' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Book a Resource
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${activeTab === 'history' ? 'bg-green-900/30 text-green-400 font-medium' : 'text-gray-400 hover:text-gray-200'}`}
          >
            My Bookings
          </button>
        </div>
      </div>
      
      {activeTab === 'book' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <div className="lg:col-span-1">
          <BookingForm 
            assets={assets}
            selectedAsset={selectedAsset}
            selectedDate={selectedDate}
            onAssetChange={setSelectedAsset}
            onDateChange={setSelectedDate}
            onChange={handleBookingChange}
            onSubmit={handleBookSlot}
          />
        </div>
        
        <div className="lg:col-span-2">
          {selectedAsset && selectedDate ? (
            loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <BookingCalendar bookings={bookings} newBooking={newBooking} />
            )
          ) : (
            <div className="bg-gray-900 rounded-lg p-6 text-gray-500 h-64 flex items-center justify-center border border-gray-800">
              Select a resource and date to view availability
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <BookingTable bookings={bookings} onRefresh={fetchBookings} />
          )}
        </div>
      )}
    </div>
  );
};

export default BookingPage;