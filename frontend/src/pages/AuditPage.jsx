import { useEffect, useState } from 'react';
import ToastNotification from '../components/ToastNotification.jsx';
import Loader from '../components/Loader.jsx';
import {
  fetchAuditCycles,
  fetchAuditCycleById,
  createAuditCycle,
  fetchAuditors,
  verifyAssetRecord,
  closeAuditCycle,
  fetchAuditHistory,
} from '../api/audit.js';

function useToast() {
  const [toast, setToast] = useState(null);
  const notify = (type, title, message) => setToast({ type, title, message });
  const close = () => setToast(null);
  return { toast, notify, close };
}

const STATUS_OPTIONS = [
  { value: 'pending',  label: 'Pending',  color: 'border-amber-400/40  bg-amber-500/10  text-amber-300' },
  { value: 'verified', label: 'Verified', color: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' },
  { value: 'missing',  label: 'Missing',  color: 'border-red-500/40     bg-red-500/10    text-red-300' },
  { value: 'damaged',  label: 'Damaged',  color: 'border-orange-500/40  bg-orange-500/10 text-orange-300' },
];

function statusColor(s) {
  return STATUS_OPTIONS.find(o => o.value === s)?.color ?? 'border-white/20 bg-white/5 text-white/60';
}

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function AuditPage() {
  const { toast, notify, close } = useToast();
  const [cycles, setCycles]               = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [auditors, setAuditors]           = useState([]);
  const [history, setHistory]             = useState([]);

  const [loadingCycles,  setLoadingCycles]  = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingCycle,    setSavingCycle]    = useState(false);
  const [closingCycle,   setClosingCycle]   = useState(false);
  const [verifyingId,    setVerifyingId]    = useState(null); // recordId being saved

  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('cycles'); // 'cycles' | 'history'
  const [form, setForm] = useState({ name: '', department: '', location: '', startDate: '', endDate: '', auditors: [] });
  const [errors, setErrors] = useState({});

  /* ── Loaders ─────────────────────────────────────────────── */
  async function loadCycles() {
    setLoadingCycles(true);
    try {
      const res = await fetchAuditCycles();
      const items = res.data || [];
      setCycles(items);
      if (items.length > 0 && !selectedCycle) await loadCycleDetails(items[0]._id);
    } catch (e) { notify('error', 'Failed to load cycles', String(e)); }
    finally { setLoadingCycles(false); }
  }

  async function loadCycleDetails(id) {
    setLoadingDetails(true);
    try {
      const data = await fetchAuditCycleById(id);
      setSelectedCycle(data);
    } catch (e) { notify('error', 'Failed to load details', String(e)); }
    finally { setLoadingDetails(false); }
  }

  async function loadAuditors() {
    try { setAuditors((await fetchAuditors()) || []); }
    catch { /* non-critical */ }
  }

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetchAuditHistory();
      setHistory(res.data || []);
    } catch (e) { notify('error', 'Failed to load history', String(e)); }
    finally { setLoadingHistory(false); }
  }

  useEffect(() => {
    loadCycles();
    loadAuditors();
    loadHistory();
  }, []);

  /* ── Form Handlers ───────────────────────────────────────── */
  function validate() {
    const e = {};
    if (!form.name.trim())       e.name       = 'Audit name is required';
    if (!form.department.trim()) e.department = 'Department is required';
    if (!form.location.trim())   e.location   = 'Location is required';
    if (!form.startDate)         e.startDate  = 'Start date is required';
    if (!form.endDate)           e.endDate    = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate))
      e.endDate = 'End date must be on or after start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleInput(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: null }));
  }

  function toggleAuditor(id) {
    setForm(p => {
      const a = [...p.auditors];
      const i = a.indexOf(id);
      i > -1 ? a.splice(i, 1) : a.push(id);
      return { ...p, auditors: a };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSavingCycle(true);
    try {
      const newCycle = await createAuditCycle(form);
      notify('success', 'Audit Cycle Created', 'Cycle initiated successfully.');
      setForm({ name: '', department: '', location: '', startDate: '', endDate: '', auditors: [] });
      setShowForm(false);
      await loadCycles();
      await loadCycleDetails(newCycle._id);
    } catch (e) { notify('error', 'Creation Failed', String(e)); }
    finally { setSavingCycle(false); }
  }

  /* ── Verify a single record ─────────────────────────────── */
  async function handleVerify(recordId, status) {
    if (!selectedCycle) return;
    setVerifyingId(recordId);
    try {
      const updated = await verifyAssetRecord(selectedCycle._id, { recordId, status });
      setSelectedCycle(updated);
      notify('success', 'Updated', `Asset marked as ${status}.`);
    } catch (e) { notify('error', 'Verification Failed', String(e)); }
    finally { setVerifyingId(null); }
  }

  /* ── Close cycle ─────────────────────────────────────────── */
  async function handleClose() {
    if (!selectedCycle) return;
    if (!window.confirm('Close this audit cycle? This action cannot be undone.')) return;
    setClosingCycle(true);
    try {
      await closeAuditCycle(selectedCycle._id);
      notify('success', 'Cycle Closed', 'The audit cycle has been closed.');
      await loadCycles();
      await loadHistory();
      setSelectedCycle(null);
    } catch (e) { notify('error', 'Close Failed', String(e)); }
    finally { setClosingCycle(false); }
  }

  /* ── Derived ─────────────────────────────────────────────── */
  const records       = selectedCycle?.records       || [];
  const discrepancies = selectedCycle?.discrepancies || [];
  const totalRec      = records.length;
  const verifiedCount = records.filter(r => r.status === 'verified').length;
  const missingCount  = records.filter(r => r.status === 'missing').length;
  const damagedCount  = records.filter(r => r.status === 'damaged').length;
  const pendingCount  = records.filter(r => r.status === 'pending').length;
  const progress      = totalRec ? Math.round((verifiedCount / totalRec) * 100) : 0;

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={close} />

      {/* Header */}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="handwriting text-5xl text-white">Asset Audit</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Initiate, monitor, and verify physical audits. Mark assets as Verified, Missing, or Damaged and track discrepancy reports.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setActiveTab('cycles'); setShowForm(!showForm); }}
              className="rounded-2xl border border-emerald-400/50 bg-emerald-900/30 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/50"
            >
              {showForm ? 'View Cycles' : '+ New Audit Cycle'}
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="mt-4 flex gap-2">
          {[['cycles', 'Active Cycles'], ['history', 'Audit History']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setShowForm(false); }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${activeTab === key ? 'border-emerald-400/50 bg-emerald-900/20 text-emerald-200' : 'border-white/10 text-white/60 hover:border-white/20 hover:text-white/80'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── ACTIVE CYCLES TAB ──────────────────────────────── */}
      {activeTab === 'cycles' && (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left: list or form */}
          <div className="space-y-4">
            {showForm ? (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <h3 className="handwriting text-3xl text-white mb-4">New Audit Cycle</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {[['name','text','Audit Name *','e.g. Q3 General Audit'],['department','text','Department *','e.g. Engineering'],['location','text','Location *','e.g. Desk E12']].map(([field,type,label,ph]) => (
                    <div key={field}>
                      <label className="block text-xs text-white/55 mb-1">{label}</label>
                      <input type={type} name={field} value={form[field]} onChange={handleInput} placeholder={ph}
                        className={`w-full rounded-2xl border bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50 ${errors[field] ? 'border-red-500/50' : 'border-white/15'}`} />
                      {errors[field] && <p className="text-red-400 text-xs mt-1">{errors[field]}</p>}
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    {[['startDate','Start Date *'],['endDate','End Date *']].map(([field,label]) => (
                      <div key={field}>
                        <label className="block text-xs text-white/55 mb-1">{label}</label>
                        <input type="date" name={field} value={form[field]} onChange={handleInput}
                          className={`w-full rounded-2xl border bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50 ${errors[field] ? 'border-red-500/50' : 'border-white/15'}`} />
                        {errors[field] && <p className="text-red-400 text-xs mt-1">{errors[field]}</p>}
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs text-white/55 mb-1">Assign Auditors</label>
                    <div className="max-h-32 overflow-y-auto rounded-2xl border border-white/15 bg-[#0f0f0f] p-3 space-y-2 scrollbar-thin">
                      {auditors.length === 0
                        ? <p className="text-xs text-white/40">No auditors found.</p>
                        : auditors.map(a => (
                          <label key={a._id} className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                            <input type="checkbox" checked={form.auditors.includes(a._id)} onChange={() => toggleAuditor(a._id)}
                              className="rounded" />
                            <span>{a.name} <span className="text-white/40">({a.role})</span></span>
                          </label>
                        ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={savingCycle}
                      className="flex-1 rounded-2xl border border-emerald-400 bg-emerald-500/15 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50">
                      {savingCycle ? 'Creating…' : 'Initiate Audit'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10">
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <h3 className="handwriting text-2xl text-white mb-3">Active Cycles</h3>
                {loadingCycles
                  ? <div className="py-6"><Loader label="Loading cycles…" /></div>
                  : cycles.length === 0
                  ? (
                    <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-8 text-center">
                      <p className="text-sm text-white/50">No active audit cycles.</p>
                      <p className="mt-1 text-xs text-white/35">Click "New Audit Cycle" to begin.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cycles.map(item => {
                        const sel = selectedCycle?._id === item._id;
                        return (
                          <article key={item._id} onClick={() => loadCycleDetails(item._id)}
                            className={`rounded-3xl border p-4 cursor-pointer transition ${sel ? 'border-emerald-300/60 bg-emerald-900/20' : 'border-white/10 bg-[#0f0f0f] hover:border-white/20'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-white text-sm">{item.name}</h4>
                                <p className="text-xs text-white/55 mt-0.5">{item.department} · {item.location}</p>
                              </div>
                              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                                active
                              </span>
                            </div>
                            <div className="mt-2 text-[11px] text-white/40 border-t border-white/5 pt-2 flex justify-between">
                              <span>{fmt(item.startDate)} → {fmt(item.endDate)}</span>
                              <span>{item.auditors?.length || 0} auditors</span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )
                }
              </section>
            )}
          </div>

          {/* Right: Cycle Detail */}
          <div>
            {loadingDetails ? (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm flex items-center justify-center min-h-[300px]">
                <Loader label="Loading audit details…" />
              </section>
            ) : selectedCycle ? (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm space-y-6">
                {/* Cycle header */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="handwriting text-2xl text-white">{selectedCycle.name}</h3>
                    <p className="text-xs text-white/50 mt-1">
                      {selectedCycle.department} · {selectedCycle.location} · {fmt(selectedCycle.startDate)} → {fmt(selectedCycle.endDate)}
                    </p>
                    {selectedCycle.auditors?.length > 0 && (
                      <p className="text-xs text-white/40 mt-1">Auditors: {selectedCycle.auditors.map(a => a.name).join(', ')}</p>
                    )}
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={closingCycle}
                    className="shrink-0 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {closingCycle ? 'Closing…' : 'Close Audit Cycle'}
                  </button>
                </div>

                {/* Progress bar */}
                {totalRec > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-white/50 mb-1">
                      <span>Verification Progress</span>
                      <span>{verifiedCount} / {totalRec} verified ({progress}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {/* Stats pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Total',    val: totalRec,      cls: 'border-white/15 bg-white/5 text-white/70' },
                    { label: 'Verified', val: verifiedCount, cls: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' },
                    { label: 'Pending',  val: pendingCount,  cls: 'border-amber-400/40 bg-amber-500/10 text-amber-300' },
                    { label: 'Missing',  val: missingCount,  cls: 'border-red-500/40 bg-red-500/10 text-red-300' },
                    { label: 'Damaged',  val: damagedCount,  cls: 'border-orange-500/40 bg-orange-500/10 text-orange-300' },
                  ].map(({ label, val, cls }) => (
                    <span key={label} className={`rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
                      {label}: {val}
                    </span>
                  ))}
                </div>

                {/* ── Verification Table ── */}
                <div>
                  <h4 className="font-semibold text-white text-sm mb-3">Asset Verification Table</h4>
                  {records.length === 0 ? (
                    <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-8 text-center">
                      <p className="text-sm text-white/50">No assets in this cycle.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0f0f0f] scrollbar-thin">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/50">
                            <th className="px-4 py-3">Asset ID</th>
                            <th className="px-4 py-3">Asset Name</th>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3 text-center">Verification Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {records.map(rec => (
                            <tr key={rec._id} className="hover:bg-white/5 transition">
                              <td className="px-4 py-3 text-white/60 font-mono text-xs">
                                {rec.assetId?.assetCode || '—'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-medium text-white">{rec.assetId?.name || 'Unknown'}</span>
                                <br />
                                <span className="text-xs text-white/40">{rec.assetId?.category || '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-white/60 text-xs">
                                {selectedCycle.department}
                              </td>
                              <td className="px-4 py-3 text-white/60 text-xs">
                                {rec.expectedLocation}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {verifyingId === rec._id ? (
                                  <span className="text-xs text-white/50">Saving…</span>
                                ) : (
                                  <select
                                    value={rec.status}
                                    onChange={ev => handleVerify(rec._id, ev.target.value)}
                                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer bg-transparent outline-none focus:ring-0 appearance-none ${statusColor(rec.status)}`}
                                  >
                                    {STATUS_OPTIONS.map(o => (
                                      <option key={o.value} value={o.value} className="bg-[#1a1a1a] text-white">
                                        {o.label}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ── Discrepancy Summary ── */}
                {discrepancies.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                      Discrepancy Report ({discrepancies.length})
                    </h4>
                    <div className="space-y-2">
                      {discrepancies.map(d => (
                        <div key={d._id}
                          className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${d.type === 'missing' ? 'border-red-500/30 bg-red-500/8' : 'border-orange-500/30 bg-orange-500/8'}`}>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {d.assetId?.assetCode ? `${d.assetId.assetCode} — ` : ''}{d.assetId?.name || 'Unknown Asset'}
                            </p>
                            {d.notes && <p className="text-xs text-white/50 mt-0.5">{d.notes}</p>}
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${d.type === 'missing' ? 'border-red-500/40 text-red-300' : 'border-orange-400/40 text-orange-300'}`}>
                            {d.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm text-center py-16">
                <p className="text-lg text-white/60">No Audit Cycle Selected</p>
                <p className="text-sm text-white/40 mt-2">Select an active cycle from the left, or create a new one.</p>
              </section>
            )}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────── */}
      {activeTab === 'history' && (
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="handwriting text-2xl text-white mb-4">Audit History</h3>
          {loadingHistory ? (
            <div className="py-8"><Loader label="Loading history…" /></div>
          ) : history.length === 0 ? (
            <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-10 text-center">
              <p className="text-sm text-white/50">No closed audit cycles yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0f0f0f] scrollbar-thin">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/50">
                    <th className="px-4 py-3">Cycle Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-center">Total</th>
                    <th className="px-4 py-3 text-center">Verified</th>
                    <th className="px-4 py-3 text-center">Missing</th>
                    <th className="px-4 py-3 text-center">Damaged</th>
                    <th className="px-4 py-3">Closed On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map(h => (
                    <tr key={h._id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 font-medium text-white">{h.name}</td>
                      <td className="px-4 py-3 text-white/60 text-xs">{h.department}</td>
                      <td className="px-4 py-3 text-white/50 text-xs">{fmt(h.startDate)} → {fmt(h.endDate)}</td>
                      <td className="px-4 py-3 text-center text-white/70">{h.summary?.total ?? 0}</td>
                      <td className="px-4 py-3 text-center text-emerald-400">{h.summary?.verified ?? 0}</td>
                      <td className="px-4 py-3 text-center text-red-400">{h.summary?.missing ?? 0}</td>
                      <td className="px-4 py-3 text-center text-orange-400">{h.summary?.damaged ?? 0}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">{fmt(h.closedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
