import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { fetchAllocations, returnAllocation } from '../api/allocations.js';
import { fetchUsers } from '../api/dashboard.js';
import Loader from '../components/Loader.jsx';
import ToastNotification from '../components/ToastNotification.jsx';

function useToast() {
  const [toast, setToast] = useState(null);
  const notify = (type, title, message) => setToast({ type, title, message });
  const close = () => setToast(null);
  return { toast, notify, close };
}

export default function EmployeeAssetsPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [allocations, setAllocations] = useState([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Return asset modal state
  const [confirmReturnId, setConfirmReturnId] = useState(null);
  const [returnRemarks, setReturnRemarks] = useState('');

  const { toast, notify, close } = useToast();

  // Load employee list
  useEffect(() => {
    fetchUsers()
      .then((data) => {
        setUsers(data || []);
        if (data && data.length > 0) {
          setSelectedUser(data[0]._id);
        }
      })
      .catch((err) => notify('error', 'Error Loading Employees', err.message || String(err)))
      .finally(() => setLoadingUsers(false));
  }, []);

  // Load allocations whenever employee selection changes
  useEffect(() => {
    if (!selectedUser) {
      setAllocations([]);
      return;
    }

    setLoadingAllocations(true);
    fetchAllocations({ employee: selectedUser })
      .then((res) => {
        setAllocations(res.data || []);
      })
      .catch((err) => notify('error', 'Error Loading Employee Assets', err.message || String(err)))
      .finally(() => setLoadingAllocations(false));
  }, [selectedUser]);

  const handleReturnAsset = () => {
    if (!confirmReturnId) return;

    returnAllocation(confirmReturnId, returnRemarks)
      .then(() => {
        notify('success', 'Asset Checked In', 'The asset was successfully returned.');
        setConfirmReturnId(null);
        setReturnRemarks('');
        // Reload allocations
        setLoadingAllocations(true);
        fetchAllocations({ employee: selectedUser })
          .then((res) => setAllocations(res.data || []))
          .catch((err) => console.error(err))
          .finally(() => setLoadingAllocations(false));
      })
      .catch((err) => notify('error', 'Return Failed', err.message || String(err)));
  };

  const activeAllocations = allocations.filter(a => a.status !== 'Returned');
  const pastAllocations = allocations.filter(a => a.status === 'Returned');

  if (loadingUsers) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label="Loading employee records..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={close} />

      <div>
        <h2 className="handwriting text-3xl font-bold text-white">Employee Assets Inquiry</h2>
        <p className="text-sm text-white/50">View all assets assigned, checked-out, or previously held by a selected employee.</p>
      </div>

      {/* Selector */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="max-w-md">
          <label className="block text-xs font-semibold text-white/60 uppercase mb-2">Select Employee</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-2.5 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
          >
            <option value="">Choose an employee...</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} — {u.email} ({u.department?.name || 'No Dept'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Asset Inquiry Results */}
      {selectedUser && (
        <div className="space-y-6">
          {loadingAllocations ? (
            <div className="flex h-48 items-center justify-center">
              <Loader label="Searching employee allocations..." />
            </div>
          ) : (
            <>
              {/* Active Holdings */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-4">Active Assets Checked Out</h3>
                {activeAllocations.length === 0 ? (
                  <p className="text-sm text-white/40 text-center py-6">No assets currently checked out to this employee.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/80">
                      <thead>
                        <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/50">
                          <th className="pb-3 pr-4">Asset</th>
                          <th className="pb-3 pr-4">Department</th>
                          <th className="pb-3 pr-4">Allocation Date</th>
                          <th className="pb-3 pr-4">Expected Return</th>
                          <th className="pb-3 pr-4">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {activeAllocations.map((alloc) => (
                          <tr key={alloc._id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 pr-4">
                              <NavLink to={`/assets/${alloc.asset?._id}`} className="hover:underline font-semibold text-white block">
                                {alloc.asset?.name || 'Unknown Asset'}
                              </NavLink>
                              <span className="text-xs text-white/45">{alloc.asset?.assetCode}</span>
                            </td>
                            <td className="py-3 pr-4">{alloc.department?.name || 'N/A'}</td>
                            <td className="py-3 pr-4">
                              {new Date(alloc.allocationDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 pr-4">
                              {new Date(alloc.expectedReturnDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                alloc.status === 'Allocated' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                                'bg-red-500/10 text-red-400 border border-red-500/25'
                              }`}>
                                {alloc.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => setConfirmReturnId(alloc._id)}
                                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20"
                              >
                                Check In (Return)
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Past History */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-4">Past Allocation History</h3>
                {pastAllocations.length === 0 ? (
                  <p className="text-sm text-white/40 text-center py-6">No previous check-in records for this employee.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-white/80">
                      <thead>
                        <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/50">
                          <th className="pb-3 pr-4">Asset</th>
                          <th className="pb-3 pr-4">Department</th>
                          <th className="pb-3 pr-4">Allocated On</th>
                          <th className="pb-3 pr-4">Returned On</th>
                          <th className="pb-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {pastAllocations.map((alloc) => (
                          <tr key={alloc._id}>
                            <td className="py-3 pr-4">
                              <NavLink to={`/assets/${alloc.asset?._id}`} className="hover:underline font-semibold text-white block">
                                {alloc.asset?.name || 'Unknown Asset'}
                              </NavLink>
                              <span className="text-[10px] text-white/45">{alloc.asset?.assetCode}</span>
                            </td>
                            <td className="py-3 pr-4">{alloc.department?.name || 'N/A'}</td>
                            <td className="py-3 pr-4">
                              {new Date(alloc.allocationDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 pr-4">
                              {new Date(alloc.actualReturnDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-white/70 max-w-[200px] truncate" title={alloc.remarks}>
                              {alloc.remarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Return Asset Confirmation Dialog */}
      {confirmReturnId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#121212] p-6 shadow-2xl">
            <h3 className="handwriting text-2xl font-bold text-white mb-2">Check In Allocated Asset</h3>
            <p className="text-sm text-white/70 mb-4">Are you sure you want to mark this asset as returned? This will automatically restore its status to "Available".</p>
            
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-white/60 uppercase">Return Remarks</label>
              <textarea
                value={returnRemarks}
                onChange={(e) => setReturnRemarks(e.target.value)}
                rows="2"
                placeholder="Remarks (e.g. Checked-in by department admin)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500/40 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setConfirmReturnId(null); setReturnRemarks(''); }}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnAsset}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
