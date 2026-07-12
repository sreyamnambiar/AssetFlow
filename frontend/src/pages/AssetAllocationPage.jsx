import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  fetchAllocations,
  createAllocation,
  updateAllocation,
  returnAllocation,
  deleteAllocation,
} from '../api/allocations.js';
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

export default function AssetAllocationPage() {
  const [allocations, setAllocations] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(true);

  // Form selections
  const [availableAssets, setAvailableAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('allocationDate');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form fields
  const [formAsset, setFormAsset] = useState('');
  const [formEmployee, setFormEmployee] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formExpectedReturn, setFormExpectedReturn] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formStatus, setFormStatus] = useState('Allocated');
  const [errors, setErrors] = useState({});

  // Confirmation state
  const [confirmReturnId, setConfirmReturnId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionRemarks, setActionRemarks] = useState('');

  const { toast, notify, close } = useToast();

  const loadData = () => {
    setLoading(true);
    fetchAllocations({
      search,
      status: statusFilter,
      department: deptFilter,
      employee: empFilter,
      dateFrom,
      dateTo,
      sortBy,
      order,
      page,
      limit: 10,
    })
      .then((res) => {
        setAllocations(res.data);
        setMeta(res.meta);
      })
      .catch((err) => notify('error', 'Error Loading Allocations', err.message || String(err)))
      .finally(() => setLoading(false));
  };

  // Load dropdown resources
  const loadResources = () => {
    // Fetch available assets
    fetchAssets({ status: 'Available' })
      .then((data) => setAvailableAssets(data))
      .catch((err) => console.error('Error fetching assets', err));

    // Fetch users
    fetchUsers()
      .then((data) => setUsers(data))
      .catch((err) => console.error('Error fetching users', err));

    // Fetch departments
    fetchDepartments()
      .then((data) => setDepartments(data))
      .catch((err) => console.error('Error fetching departments', err));
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, deptFilter, empFilter, dateFrom, dateTo, sortBy, order, page]);

  useEffect(() => {
    loadResources();
  }, []);

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentId(null);
    setFormAsset('');
    setFormEmployee('');
    setFormDepartment('');
    setFormExpectedReturn('');
    setFormRemarks('');
    setFormStatus('Allocated');
    setErrors({});
    // Reload resources to make sure we have latest available assets
    loadResources();
    setShowModal(true);
  };

  const openEditModal = (alloc) => {
    setEditMode(true);
    setCurrentId(alloc._id);
    setFormAsset(alloc.asset?._id || '');
    setFormEmployee(alloc.employee?._id || '');
    setFormDepartment(alloc.department?._id || '');
    setFormExpectedReturn(alloc.expectedReturnDate ? alloc.expectedReturnDate.split('T')[0] : '');
    setFormRemarks(alloc.remarks || '');
    setFormStatus(alloc.status || 'Allocated');
    setErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!editMode && !formAsset) newErrors.asset = 'Asset is required';
    if (!formEmployee) newErrors.employee = 'Employee is required';
    if (!formDepartment) newErrors.department = 'Department is required';
    if (!formExpectedReturn) newErrors.expectedReturn = 'Expected return date is required';
    if (formExpectedReturn && new Date(formExpectedReturn) < new Date()) {
      newErrors.expectedReturn = 'Expected return date must be in the future';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editMode) {
      updateAllocation(currentId, {
        expectedReturnDate: formExpectedReturn,
        remarks: formRemarks,
        status: formStatus,
      })
        .then(() => {
          notify('success', 'Allocation Updated', 'The allocation has been updated successfully.');
          setShowModal(false);
          loadData();
          loadResources(); // refresh dropdown assets list
        })
        .catch((err) => notify('error', 'Update Failed', err.message || String(err)));
    } else {
      createAllocation({
        asset: formAsset,
        employee: formEmployee,
        department: formDepartment,
        expectedReturnDate: formExpectedReturn,
        remarks: formRemarks,
      })
        .then(() => {
          notify('success', 'Allocation Successful', 'The asset has been allocated successfully.');
          setShowModal(false);
          loadData();
          loadResources(); // refresh dropdown assets list
        })
        .catch((err) => notify('error', 'Allocation Failed', err.message || String(err)));
    }
  };

  const handleReturnConfirm = () => {
    returnAllocation(confirmReturnId, actionRemarks)
      .then(() => {
        notify('success', 'Asset Returned', 'The asset has been returned and is now Available.');
        setConfirmReturnId(null);
        setActionRemarks('');
        loadData();
        loadResources();
      })
      .catch((err) => notify('error', 'Return Failed', err.message || String(err)));
  };

  const handleDeleteConfirm = () => {
    deleteAllocation(confirmDeleteId)
      .then(() => {
        notify('success', 'Allocation Deleted', 'Allocation record was deleted successfully.');
        setConfirmDeleteId(null);
        loadData();
        loadResources();
      })
      .catch((err) => notify('error', 'Delete Failed', err.message || String(err)));
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

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="handwriting text-3xl font-bold text-white">Asset Allocation Management</h2>
          <p className="text-sm text-white/50">Allocate assets to employees, manage expected returns, and track check-ins.</p>
        </div>
        <div>
          <button
            onClick={openCreateModal}
            className="rounded-xl border border-emerald-500/30 bg-emerald-900/30 px-5 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-800/40 transition"
          >
            + Allocate Asset
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Asset Name, code, employee, dept..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-white/10 bg-[#121212] px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Allocated">Allocated</option>
            <option value="Returned">Returned</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-white/10 bg-[#121212] px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader label="Loading allocations..." />
          </div>
        ) : allocations.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <p className="text-sm text-white/40">No allocations found matching the filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white/80">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/50">
                    <th className="pb-3 pr-4 cursor-pointer hover:text-white" onClick={() => handleSort('asset')}>
                      Asset {sortBy === 'asset' && (order === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="pb-3 pr-4 cursor-pointer hover:text-white" onClick={() => handleSort('employee')}>
                      Employee {sortBy === 'employee' && (order === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="pb-3 pr-4 cursor-pointer hover:text-white" onClick={() => handleSort('department')}>
                      Department {sortBy === 'department' && (order === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="pb-3 pr-4 cursor-pointer hover:text-white" onClick={() => handleSort('allocationDate')}>
                      Allocated On {sortBy === 'allocationDate' && (order === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="pb-3 pr-4">Expected Return</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allocations.map((alloc) => (
                    <tr key={alloc._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4">
                        <div>
                          <div className="font-semibold text-white">{alloc.asset?.name || 'Unknown Asset'}</div>
                          <div className="text-xs text-white/45">{alloc.asset?.assetCode}</div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">{alloc.employee?.name || 'N/A'}</td>
                      <td className="py-3 pr-4">{alloc.department?.name || 'N/A'}</td>
                      <td className="py-3 pr-4">
                        {new Date(alloc.allocationDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        {new Date(alloc.expectedReturnDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          alloc.status === 'Allocated' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                          alloc.status === 'Returned' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                          'bg-red-500/10 text-red-400 border border-red-500/25'
                        }`}>
                          {alloc.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <NavLink to={`/assets/${alloc.asset?._id}`} className="text-xs text-indigo-400 hover:underline">
                            View
                          </NavLink>
                          <button onClick={() => openEditModal(alloc)} className="text-xs text-amber-400 hover:underline">
                            Edit
                          </button>
                          {alloc.status !== 'Returned' && (
                            <button onClick={() => setConfirmReturnId(alloc._id)} className="text-xs text-emerald-400 hover:underline">
                              Return
                            </button>
                          )}
                          <button onClick={() => setConfirmDeleteId(alloc._id)} className="text-xs text-red-400 hover:underline">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs text-white/55">
                <span>Showing page {meta.currentPage} of {meta.totalPages} ({meta.totalRecords} total records)</span>
                <div className="flex gap-2">
                  <button
                    disabled={meta.currentPage === 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={meta.currentPage === meta.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Allocate / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#121212] p-6 shadow-2xl">
            <h3 className="handwriting text-2xl font-bold text-white mb-4">
              {editMode ? 'Edit Asset Allocation' : 'New Asset Allocation'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editMode ? (
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Asset *</label>
                  <select
                    value={formAsset}
                    onChange={(e) => setFormAsset(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
                  >
                    <option value="">Select available asset</option>
                    {availableAssets.map((asset) => (
                      <option key={asset._id} value={asset._id}>
                        {asset.name} ({asset.assetCode})
                      </option>
                    ))}
                  </select>
                  {errors.asset && <span className="text-[11px] text-red-400 mt-1 block">{errors.asset}</span>}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Asset</label>
                  <input
                    type="text"
                    disabled
                    value={allocations.find(a => a._id === currentId)?.asset?.name || ''}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Employee *</label>
                <select
                  value={formEmployee}
                  onChange={(e) => setFormEmployee(e.target.value)}
                  disabled={editMode}
                  className="w-full rounded-xl border border-white/10 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select Employee</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                {errors.employee && <span className="text-[11px] text-red-400 mt-1 block">{errors.employee}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Department *</label>
                <select
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  disabled={editMode}
                  className="w-full rounded-xl border border-white/10 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
                {errors.department && <span className="text-[11px] text-red-400 mt-1 block">{errors.department}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Expected Return Date *</label>
                <input
                  type="date"
                  value={formExpectedReturn}
                  onChange={(e) => setFormExpectedReturn(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
                />
                {errors.expectedReturn && <span className="text-[11px] text-red-400 mt-1 block">{errors.expectedReturn}</span>}
              </div>

              {editMode && (
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
                  >
                    <option value="Allocated">Allocated</option>
                    <option value="Returned">Returned</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase mb-1">Remarks</label>
                <textarea
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  rows="3"
                  placeholder="Enter remarks..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  {editMode ? 'Save Changes' : 'Allocate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Asset Confirmation Dialog */}
      {confirmReturnId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#121212] p-6 shadow-2xl">
            <h3 className="handwriting text-2xl font-bold text-white mb-2">Return Allocated Asset</h3>
            <p className="text-sm text-white/70 mb-4">Are you sure you want to mark this asset as returned? This will automatically restore its status to "Available".</p>
            
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-white/60 uppercase">Return Remarks / Notes</label>
              <textarea
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                rows="2"
                placeholder="Remarks (e.g. Returned in good condition)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setConfirmReturnId(null); setActionRemarks(''); }}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnConfirm}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#121212] p-6 shadow-2xl">
            <h3 className="handwriting text-2xl font-bold text-white mb-2">Delete Allocation</h3>
            <p className="text-sm text-white/70 mb-6">Are you sure you want to delete this allocation record? If this allocation is currently active, the asset will be set back to "Available". This action cannot be undone.</p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
