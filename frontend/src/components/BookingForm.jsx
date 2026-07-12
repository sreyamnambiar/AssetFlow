import { useEffect, useState } from 'react';

const emptyForm = {
  assetId: '',
  bookingDate: '',
  startTime: '',
  endTime: '',
  purpose: '',
};

export default function BookingForm({ resources = [], initialValues = null, onSubmit, onCancelEdit, loading = false }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!initialValues) {
      setForm(emptyForm);
      return;
    }

    setForm({
      assetId: initialValues.assetId?._id || initialValues.assetId || '',
      bookingDate: initialValues.bookingDate || '',
      startTime: initialValues.startTime || '',
      endTime: initialValues.endTime || '',
      purpose: initialValues.purpose || '',
    });
  }, [initialValues]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form, Boolean(initialValues));
    if (!initialValues) {
      setForm(emptyForm);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="handwriting text-3xl text-white">Book a Slot</h3>
          <p className="mt-1 text-sm text-white/55">Reserve a shared resource with overlap protection.</p>
        </div>
        {initialValues ? (
          <button type="button" onClick={onCancelEdit} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/5">Cancel Edit</button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm text-white/70">Resource</span>
          <select value={form.assetId} onChange={(event) => updateField('assetId', event.target.value)} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50">
            <option value="">Select a resource</option>
            {resources.map((resource) => (
              <option key={resource._id} value={resource._id}>
                {resource.assetCode ? `${resource.assetCode} - ` : ''}{resource.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/70">Date</span>
          <input type="date" value={form.bookingDate} onChange={(event) => updateField('bookingDate', event.target.value)} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50" />
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/70">Start Time</span>
          <input type="time" value={form.startTime} onChange={(event) => updateField('startTime', event.target.value)} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50" />
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/70">End Time</span>
          <input type="time" value={form.endTime} onChange={(event) => updateField('endTime', event.target.value)} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50" />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm text-white/70">Purpose</span>
          <textarea rows="3" value={form.purpose} onChange={(event) => updateField('purpose', event.target.value)} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50" placeholder="Describe the meeting, presentation, or use case" />
        </label>
      </div>

      <button type="submit" disabled={loading} className="mt-5 inline-flex items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-900/70 px-5 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? 'Saving...' : initialValues ? 'Update Booking' : 'Create Booking'}
      </button>
    </form>
  );
}