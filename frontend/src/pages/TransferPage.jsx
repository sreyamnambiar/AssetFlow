import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { createTransfer, fetchTransfers } from '../api/transfers.js';
import { fetchAllocations } from '../api/allocations.js';
import { fetchAssets } from '../api/assets.js';
import { fetchUsers, fetchDepartments } from '../api/dashboard.js';
import Loader from '../components/Loader.jsx';
import ToastNotification from '../components/ToastNotification.jsx';

function useToast() {
  const [toast, setToast] = useState(null);
  const notify = (type, title, message) => setToast({ type, title, message });
  const close = () => setToast(null);
  return { toast, notify, close };
}

export default function TransferPage() {
  const [transfers, setTransfers] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(true);

  // Form selections resources
  const [transferableAssets, setTransferableAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Search & Filter state for History Table
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('transferDate');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Form state
  const [formAsset, setFormAsset] = useState('');
  const [fromEmployee, setFromEmployee] = useState(null);
  const [fromDepartment, setFromDepartment] = useState(null);
  const [toEmployee, setToEmployee] = useState('');
  const [toDepartment, setToDepartment] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  // Confirmation state
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { toast, notify, close } = useToast();

  const loadHistory = () => {
    setLoading(true);
    fetchTransfers({
      search,
      department: deptFilter,
      employee: empFilter,
      category: categoryFilter,
      dateFrom,
      dateTo,
      sortBy,
      order,
      page,
      limit: 10,
    })
      .then((res) => {
        setTransfers(res.data);
        setMeta(res.meta);
      })
      .catch((err) => notify('error', 'Error Loading Transfer History', err.message || String(err)))
      .finally(() => setLoading(false));
  };

  // Load dropdown resources
  const loadResources = () => {
    // Fetch all transferable assets (status is Available or Allocated)
    // We can do two requests or fetch all assets and filter them
    fetchAssets()
      .then((data) => {
        const filtered = data.filter(a => ['Available', 'Allocated', 'Assigned'].includes(a.status));
        setTransferableAssets(filtered);
      })
      .catch((err) => console.error('Error fetching transferable assets', err));

    fetchUsers()
      .then((data) => setUsers(data))
      .catch((err) => console.error('Error fetching users', err));

    fetchDepartments()
      .then((data) => setDepartments(data))
      .catch((err) => console.error('Error fetching departments', err));
  };

  useEffect(() => {
    loadHistory();
  }, [search, deptFilter, empFilter, categoryFilter, dateFrom, dateTo, sortBy, order, page]);

  useEffect(() => {
    loadResources();
  }, []);

  // When asset is selected in transfer form, lookup who currently has it allocated
  useEffect(() => {
    if (!formAsset) {
      setFromEmployee(null);
      setFromDepartment(null);
      return;
    }

    fetchAllocations({ asset: formAsset, status: 'Allocated' })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const activeAlloc = res.data[0];
          setFromEmployee(activeAlloc.employee);
          setFromDepartment(activeAlloc.department);
        } else {
          setFromEmployee(null);
          setFromDepartment(null);
        }
      })
      .catch((err) => {
        console.error('Error checking active allocation', err);
        setFromEmployee(null);
        setFromDepartment(null);
      });
  }, [formAsset]);

  const validateForm = () => {
    const newErrors = {};
    if (!formAsset) newErrors.asset = 'Asset is required';
    if (!toEmployee) newErrors.toEmployee = 'Recipient employee is required';
    if (!toDepartment) newErrors.toDepartment = 'Recipient department is required';
    if (!reason.trim()) newErrors.reason = 'Reason for transfer is required';

    if (toEmployee && fromEmployee && toEmployee === fromEmployee._id) {
      newErrors.toEmployee = 'Recipient employee must be different from current owner';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTransferClick = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    setSubmitting(true);
    createTransfer({
      asset: formAsset,
      toEmployee,
      toDepartment,
      reason,
      notes,
    })
      .then(() => {
        notify('success', 'Transfer Completed', 'The asset ownership has been successfully transferred.');
        // Reset form
        setFormAsset('');
        setToEmployee('');
        setToDepartment('');
        setReason('');
        setNotes('');
        setShowConfirm(false);
        // Reload resources & history
        loadResources();
        loadHistory();
      })
      .catch((err) => {
        notify('error', 'Transfer Failed', err.message || String(err));
        setShowConfirm(false);
      })
      .finally(() => setSubmitting(false));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={close} />

      <div>
        <h2 className="handwriting text-3xl font-bold text-white">Asset Transfer Management</h2>
        <p className="text-sm text-white/50">Transfer ownership of assets between departments or employees. Automatically handles check-ins and re-allocations.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Form Panel */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-1 h-fit">
          <h3 className="handwriting text-xl font-bold text-white mb-4">Create New Transfer</h3>
          
          <form onSubmit={handleTransferClick} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Asset *</label>
              <select
                value={formAsset}
                onChange={(e) => setFormAsset(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
              >
                <option value="">Select Asset to Transfer</option>
                {transferableAssets.map((asset) => (
                  <option key={asset._id} value={asset._id}>
                    {asset.name} ({asset.assetCode}) — {asset.status}
                  </option>
                ))}
              </select>
              {errors.asset && <span className="text-[11px] text-red-400 mt-1 block">{errors.asset}</span>}
            </div>

            {/* Auto-populated Previous Owner details */}
            <div className="rounded-xl border border-white/5 bg-white/5 p-3 space-y-2 text-xs">
              <span className="block font-semibold text-white/55">CURRENT OWNERSHIP:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-white/45 block">From Employee</span>
                  <span className="text-white font-medium">{fromEmployee ? fromEmployee.name : 'None / Available'}</span>
                </div>
                <div>
                  <span className="text-white/45 block">From Department</span>
                  <span className="text-white font-medium">{fromDepartment ? fromDepartment.name : 'None / Available'}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Recipient Employee (To Employee) *</label>
              <select
                value={toEmployee}
                onChange={(e) => setToEmployee(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
              >
                <option value="">Select Recipient Employee</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
              {errors.toEmployee && <span className="text-[11px] text-red-400 mt-1 block">{errors.toEmployee}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Recipient Department (To Department) *</label>
              <select
                value={toDepartment}
                onChange={(e) => setToDepartment(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
              >
                <option value="">Select Recipient Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              {errors.toDepartment && <span className="text-[11px] text-red-400 mt-1 block">{errors.toDepartment}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Reason for Transfer *</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Department reassignment"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
              />
              {errors.reason && <span className="text-[11px] text-red-400 mt-1 block">{errors.reason}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                placeholder="Additional notes..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
            >
              Initiate Transfer
            </button>
          </form>
        </div>

        {/* Right History Table Panel */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-2 space-y-4">
          <h3 className="handwriting text-xl font-bold text-white">Transfer History Log</h3>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search history..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-white/10 bg-[#121212] px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Monitor">Monitor</option>
                <option value="Printer">Printer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <select
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-white/10 bg-[#121212] px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={empFilter}
                onChange={(e) => { setEmpFilter(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-white/10 bg-[#121212] px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="">All Employees</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader label="Loading transfer log..." />
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-white/40">No transfers found in the logs.</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-white/80">
                  <thead>
                    <tr className="border-b border-white/10 font-semibold uppercase tracking-wider text-white/50">
                      <th className="pb-3 pr-2 cursor-pointer hover:text-white" onClick={() => handleSort('asset')}>
                        Asset {sortBy === 'asset' && (order === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="pb-3 pr-2">From Ownership</th>
                      <th className="pb-3 pr-2 cursor-pointer hover:text-white" onClick={() => handleSort('employee')}>
                        To Ownership {sortBy === 'employee' && (order === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="pb-3 pr-2 cursor-pointer hover:text-white" onClick={() => handleSort('transferDate')}>
                        Transfer Date {sortBy === 'transferDate' && (order === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="pb-3 pr-2">Reason</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transfers.map((tx) => (
                      <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 pr-2">
                          <NavLink to={`/assets/${tx.asset?._id}`} className="hover:underline font-semibold text-white block">
                            {tx.asset?.name || 'Deleted Asset'}
                          </NavLink>
                          <span className="text-[10px] text-white/45">{tx.asset?.assetCode}</span>
                        </td>
                        <td className="py-3 pr-2">
                          <div className="text-white/70">{tx.fromEmployee?.name || 'Available / None'}</div>
                          <div className="text-[10px] text-white/45">{tx.fromDepartment?.name || 'N/A'}</div>
                        </td>
                        <td className="py-3 pr-2">
                          <div className="font-medium text-white">{tx.toEmployee?.name || 'N/A'}</div>
                          <div className="text-[10px] text-white/45">{tx.toDepartment?.name || 'N/A'}</div>
                        </td>
                        <td className="py-3 pr-2">
                          {new Date(tx.transferDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 pr-2 max-w-[120px] truncate" title={tx.reason}>{tx.reason}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            tx.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                            tx.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                            'bg-red-500/10 text-red-400 border-red-500/25'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-white/55">
                  <span>Page {meta.currentPage} of {meta.totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={meta.currentPage === 1}
                      onClick={() => setPage(page - 1)}
                      className="rounded border border-white/10 px-2 py-1 hover:bg-white/5 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      disabled={meta.currentPage === meta.totalPages}
                      onClick={() => setPage(page + 1)}
                      className="rounded border border-white/10 px-2 py-1 hover:bg-white/5 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#121212] p-6 shadow-2xl">
            <h3 className="handwriting text-2xl font-bold text-white mb-2">Confirm Asset Transfer</h3>
            <p className="text-sm text-white/70 mb-4">You are about to transfer the asset to a new employee and department. This will:</p>
            
            <ul className="text-xs text-white/60 list-disc pl-5 space-y-1 mb-5">
              <li>Auto-close the previous active allocation for this asset.</li>
              <li>Instantly create a new active allocation for the recipient employee.</li>
              <li>Record a permanent transfer log.</li>
            </ul>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirm(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
