import { useEffect, useMemo, useState } from 'react';
import BookingCalendar from '../components/BookingCalendar.jsx';
import BookingForm from '../components/BookingForm.jsx';
import BookingTable from '../components/BookingTable.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import Loader from '../components/Loader.jsx';
import ToastNotification from '../components/ToastNotification.jsx';
import {
  cancelBooking,
  createBooking,
  fetchBookableAssets,
  fetchBookings,
  updateBooking,
} from '../api/bookings.js';

const currentDate = new Date().toISOString().slice(0, 10);

function useToast() {
  const [toast, setToast] = useState(null);
  const notify = (type, title, message) => setToast({ type, title, message });
  const close = () => setToast(null);
  return { toast, notify, close };
}

export default function BookingPage() {
  const { toast, notify, close } = useToast();
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [editingBooking, setEditingBooking] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const resourceOptions = useMemo(() => resources, [resources]);

  async function loadResources() {
    const items = await fetchBookableAssets();
    setResources(items);
    if (!selectedResource && items.length) {
      setSelectedResource(items[0]._id);
    }
  }

  async function loadBookings() {
    setLoading(true);
    try {
      const response = await fetchBookings({ page, limit: 10, status: status || undefined, search: search || undefined, bookingDate: selectedDate || undefined, assetId: selectedResource || undefined });
      setBookings(response.data || []);
      setPagination(response.meta || { page: 1, totalPages: 1 });
    } catch (error) {
      notify('error', 'Bookings not loaded', String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources().catch((error) => notify('error', 'Resources not loaded', String(error)));
  }, []);

  useEffect(() => {
    loadBookings().catch((error) => notify('error', 'Bookings not loaded', String(error)));
  }, [page, selectedDate, selectedResource, status, search]);

  async function handleSubmit(form, isEditing) {
    setSaving(true);
    try {
      if (isEditing && editingBooking) {
        await updateBooking(editingBooking._id, form);
        notify('success', 'Booking updated', 'The booking has been rescheduled successfully.');
      } else {
        await createBooking(form);
        notify('success', 'Booking created', 'The booking has been created successfully.');
      }
      setEditingBooking(null);
      await loadBookings();
    } catch (error) {
      notify('error', 'Booking failed', String(error));
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    try {
      await cancelBooking(cancelTarget._id);
      notify('success', 'Booking cancelled', 'The reservation was cancelled successfully.');
      setCancelTarget(null);
      await loadBookings();
    } catch (error) {
      notify('error', 'Cancellation failed', String(error));
    }
  }

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={close} />
      <ConfirmationModal
        open={Boolean(cancelTarget)}
        title="Cancel booking?"
        message="This will mark the booking as cancelled and keep it in the history log."
        confirmLabel="Cancel booking"
        onConfirm={confirmCancel}
        onClose={() => setCancelTarget(null)}
      />

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="handwriting text-2xl text-white/60">Screen 6</p>
            <h2 className="handwriting text-5xl text-white">Resource Booking</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/55">Book shared assets with overlap prevention, status tracking, and a timeline view that matches the provided mockup.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 lg:w-[62%]">
            <label className="space-y-2">
              <span className="text-sm text-white/65">Search</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search purpose" className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50" />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/65">Filter Status</span>
              <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50">
                <option value="">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/65">Date</span>
              <input type="date" value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setPage(1); }} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50" />
            </label>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <div className="space-y-6">
          <BookingForm resources={resourceOptions} initialValues={editingBooking} onSubmit={handleSubmit} onCancelEdit={() => setEditingBooking(null)} loading={saving} />
          {loading ? <Loader label="Loading booking data..." /> : null}
        </div>

        <BookingCalendar bookings={bookings} selectedDate={selectedDate} selectedResource={selectedResource} onBookSlot={() => setPage(1)} />
      </div>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="handwriting text-3xl text-white">Available Resources</h3>
            <p className="mt-1 text-sm text-white/55">Select the active resource for the timeline view.</p>
          </div>
          <div className="min-w-[260px]">
            <select value={selectedResource} onChange={(event) => setSelectedResource(event.target.value)} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50">
              {resources.map((resource) => (
                <option key={resource._id} value={resource._id}>{resource.assetCode ? `${resource.assetCode} - ` : ''}{resource.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {resources.slice(0, 3).map((resource) => (
            <article key={resource._id} className="rounded-3xl border border-white/10 bg-[#0f0f0f] p-4">
              <p className="text-sm font-semibold text-white">{resource.name}</p>
              <p className="mt-1 text-xs text-white/55">{resource.assetCode || 'Bookable resource'}</p>
            </article>
          ))}
        </div>

        <BookingTable
          items={bookings}
          loading={loading}
          onEdit={setEditingBooking}
          onCancel={setCancelTarget}
          pagination={pagination}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}