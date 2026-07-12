import { useEffect, useState } from 'react';
import ToastNotification from '../components/ToastNotification.jsx';
import Loader from '../components/Loader.jsx';
import {
  fetchAuditCycles,
  fetchAuditCycleById,
  createAuditCycle,
  fetchAuditors,
} from '../api/audit.js';

function useToast() {
  const [toast, setToast] = useState(null);
  const notify = (type, title, message) => setToast({ type, title, message });
  const close = () => setToast(null);
  return { toast, notify, close };
}

export default function AuditPage() {
  const { toast, notify, close } = useToast();
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [auditors, setAuditors] = useState([]);
  
  // Loading states
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingCycle, setSavingCycle] = useState(false);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    department: '',
    location: '',
    startDate: '',
    endDate: '',
    auditors: [],
  });
  
  const [errors, setErrors] = useState({});

  async function loadCycles() {
    setLoadingCycles(true);
    try {
      const response = await fetchAuditCycles();
      const items = response.data || [];
      setCycles(items);
      
      // Select the first cycle by default if none is selected
      if (items.length > 0 && !selectedCycle) {
        await loadCycleDetails(items[0]._id);
      }
    } catch (error) {
      notify('error', 'Failed to load audit cycles', String(error));
    } finally {
      setLoadingCycles(false);
    }
  }

  async function loadCycleDetails(id) {
    setLoadingDetails(true);
    try {
      const data = await fetchAuditCycleById(id);
      setSelectedCycle(data);
    } catch (error) {
      notify('error', 'Failed to load details', String(error));
    } finally {
      setLoadingDetails(false);
    }
  }

  async function loadAuditors() {
    try {
      const list = await fetchAuditors();
      setAuditors(list || []);
    } catch (error) {
      notify('error', 'Failed to load auditors', String(error));
    }
  }

  useEffect(() => {
    loadCycles();
    loadAuditors();
  }, []);

  function validateForm() {
    const tempErrors = {};
    if (!form.name.trim()) tempErrors.name = 'Audit name is required';
    if (!form.department.trim()) tempErrors.department = 'Department is required';
    if (!form.location.trim()) tempErrors.location = 'Location is required';
    if (!form.startDate) tempErrors.startDate = 'Start date is required';
    if (!form.endDate) tempErrors.endDate = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      tempErrors.endDate = 'End date must be after or equal to start date';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }

  function handleAuditorToggle(auditorId) {
    setForm((prev) => {
      const currentAuditors = [...prev.auditors];
      const index = currentAuditors.indexOf(auditorId);
      if (index > -1) {
        currentAuditors.splice(index, 1);
      } else {
        currentAuditors.push(auditorId);
      }
      return { ...prev, auditors: currentAuditors };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSavingCycle(true);
    try {
      const newCycle = await createAuditCycle(form);
      notify('success', 'Audit Cycle Created', 'Audit cycle has been initiated successfully.');
      
      // Reset form and close
      setForm({
        name: '',
        department: '',
        location: '',
        startDate: '',
        endDate: '',
        auditors: [],
      });
      setShowForm(false);
      
      // Reload lists and select the new cycle
      await loadCycles();
      await loadCycleDetails(newCycle._id);
    } catch (error) {
      notify('error', 'Creation Failed', String(error));
    } finally {
      setSavingCycle(false);
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
      case 'missing':
        return 'border-red-500/40 bg-red-950/20 text-red-300';
      case 'damaged':
        return 'border-white/20 bg-white/5 text-white/70';
      default:
        return 'border-amber-400/40 bg-amber-500/15 text-amber-100'; // pending
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={close} />

      {/* Screen Title Banner */}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="handwriting text-2xl text-white/60">Screen 8</p>
            <h2 className="handwriting text-5xl text-white">Asset Audit</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Initiate, monitor, and check ongoing physical audits of company assets in departments and locations.
            </p>
          </div>
          <div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-2xl border border-emerald-400/50 bg-emerald-900/30 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/50"
            >
              {showForm ? 'View Checklist' : 'Create Audit Cycle'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.8fr]">
        {/* Left Side: Audit Cycles List or Create Form */}
        <div className="space-y-6">
          {showForm ? (
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
              <h3 className="handwriting text-3xl text-white mb-4">Create Audit Cycle</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/65 mb-1">Audit Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Q3 general audit"
                    className={`w-full rounded-2xl border bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50 ${errors.name ? 'border-red-500/50' : 'border-white/15'}`}
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <label className="block text-sm text-white/65 mb-1">Department *</label>
                    <input
                      type="text"
                      name="department"
                      value={form.department}
                      onChange={handleInputChange}
                      placeholder="e.g. Engineering"
                      className={`w-full rounded-2xl border bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50 ${errors.department ? 'border-red-500/50' : 'border-white/15'}`}
                    />
                    {errors.department && <p className="text-red-400 text-xs mt-1">{errors.department}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-white/65 mb-1">Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Desk E12"
                      className={`w-full rounded-2xl border bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50 ${errors.location ? 'border-red-500/50' : 'border-white/15'}`}
                    />
                    {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <label className="block text-sm text-white/65 mb-1">Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleInputChange}
                      className={`w-full rounded-2xl border bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50 ${errors.startDate ? 'border-red-500/50' : 'border-white/15'}`}
                    />
                    {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-white/65 mb-1">End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleInputChange}
                      className={`w-full rounded-2xl border bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50 ${errors.endDate ? 'border-red-500/50' : 'border-white/15'}`}
                    />
                    {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/65 mb-1">Assign Auditors</label>
                  <div className="max-h-36 overflow-y-auto rounded-2xl border border-white/15 bg-[#0f0f0f] p-3 space-y-2 scrollbar-thin">
                    {auditors.length === 0 ? (
                      <p className="text-xs text-white/40">No auditors found in database.</p>
                    ) : (
                      auditors.map((auditor) => (
                        <label key={auditor._id} className="flex items-center gap-2 text-sm text-white/80 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={form.auditors.includes(auditor._id)}
                            onChange={() => handleAuditorToggle(auditor._id)}
                            className="rounded border-white/15 bg-transparent text-emerald-500 focus:ring-0"
                          />
                          <span>{auditor.name} ({auditor.role})</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingCycle}
                    className="flex-1 rounded-2xl border border-emerald-400 bg-emerald-500/15 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {savingCycle ? 'Creating...' : 'Initiate Audit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
              <h3 className="handwriting text-3xl text-white mb-4">Audit Cycles</h3>

              {loadingCycles ? (
                <div className="py-8"><Loader label="Loading cycles..." /></div>
              ) : cycles.length === 0 ? (
                <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-8 text-center">
                  <p className="text-sm text-white/50">No audit cycles exist yet.</p>
                  <p className="mt-2 text-xs text-white/35">Click the "Create Audit Cycle" button to start an audit.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cycles.map((item) => {
                    const active = selectedCycle?._id === item._id;
                    return (
                      <article
                        key={item._id}
                        onClick={() => loadCycleDetails(item._id)}
                        className={`rounded-3xl border p-4 cursor-pointer transition ${active ? 'border-emerald-300/60 bg-emerald-900/20' : 'border-white/10 bg-[#0f0f0f] hover:border-white/20'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-white text-sm">{item.name}</h4>
                            <p className="text-xs text-white/60 mt-1">{item.department} &bull; {item.location}</p>
                          </div>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider ${item.status === 'active' ? 'border-amber-400/40 bg-amber-500/10 text-amber-300' : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-white/45 border-t border-white/5 pt-2">
                          <span>{formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
                          <span>{item.auditors?.length || 0} Auditors</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Side: Active Audit Details & Checklist Table */}
        <div>
          {loadingDetails ? (
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm flex items-center justify-center min-h-[300px]">
              <Loader label="Loading audit details..." />
            </section>
          ) : selectedCycle ? (
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm space-y-6">
              {/* Mockup Header Block */}
              <div className="rounded-3xl border border-white/15 bg-white/5 p-5 shadow-sketch">
                <h3 className="handwriting text-3xl text-white">
                  {selectedCycle.name}: {selectedCycle.department} - {formatDate(selectedCycle.startDate)} to {formatDate(selectedCycle.endDate)}
                </h3>
                <p className="text-sm text-white/70 mt-2 font-medium">
                  Auditors: {selectedCycle.auditors && selectedCycle.auditors.length > 0
                    ? selectedCycle.auditors.map(a => a.name).join(', ')
                    : 'None assigned'}
                </p>
              </div>

              {/* Checklist Table */}
              <div>
                <h4 className="font-semibold text-white text-base mb-3">Asset Checklist</h4>
                
                {selectedCycle.records && selectedCycle.records.length === 0 ? (
                  <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-8 text-center">
                    <p className="text-sm text-white/50">No assets loaded in this cycle.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0f0f0f] scrollbar-thin">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 font-semibold text-white/70">
                          <th className="px-5 py-3">Asset</th>
                          <th className="px-5 py-3">Expected location</th>
                          <th className="px-5 py-3 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {selectedCycle.records && selectedCycle.records.map((rec) => (
                          <tr key={rec._id} className="hover:bg-white/5 transition">
                            <td className="px-5 py-4">
                              <span className="font-semibold text-white block">
                                {rec.assetId?.assetCode ? `${rec.assetId.assetCode} - ` : ''}{rec.assetId?.name || 'Unknown'}
                              </span>
                              <span className="text-xs text-white/45">{rec.assetId?.category || 'General Asset'}</span>
                            </td>
                            <td className="px-5 py-4 text-white/70 font-medium">
                              {rec.expectedLocation}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={`inline-block rounded-full border px-4 py-1 text-xs font-semibold tracking-wide capitalize ${getStatusColor(rec.status)}`}>
                                {rec.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-sketch backdrop-blur-sm text-center py-16">
              <p className="text-lg text-white/60">No Audit Cycle Selected</p>
              <p className="text-sm text-white/40 mt-2">Create an audit cycle or select one from the list to view its checklist.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
