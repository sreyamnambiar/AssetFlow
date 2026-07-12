import React, { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import axios from 'axios';
import { fetchAllocations } from '../api/allocations.js';
import { fetchTransfers } from '../api/transfers.js';
import Loader from '../components/Loader.jsx';
import ToastNotification from '../components/ToastNotification.jsx';

function useToast() {
  const [toast, setToast] = useState(null);
  const notify = (type, title, message) => setToast({ type, title, message });
  const close = () => setToast(null);
  return { toast, notify, close };
}

export default function AssetDetailsPage() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [historyTimeline, setHistoryTimeline] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // info, allocations, transfers, timeline
  const { toast, notify, close } = useToast();

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    
    // Fetch Asset Details, Allocation History, Transfer History, and Audit Timeline concurrently
    Promise.all([
      axios.get(`/api/assets/${id}`),
      fetchAllocations({ asset: id }),
      fetchTransfers({ asset: id }),
      axios.get(`/api/assets/${id}/history`)
    ])
      .then(([assetRes, allocationsRes, transfersRes, historyRes]) => {
        setAsset(assetRes.data.data);
        setAllocations(allocationsRes.data || []);
        setTransfers(transfersRes.data || []);
        setHistoryTimeline(historyRes.data.data || []);
      })
      .catch((err) => {
        notify('error', 'Error Loading Details', err.message || String(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label="Loading asset details..." />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12 rounded-2xl border border-white/10 bg-white/5">
        <p className="text-sm text-white/40">Asset not found.</p>
        <NavLink to="/allocations" className="mt-4 inline-block text-xs text-indigo-400 hover:underline">
          Back to Allocations
        </NavLink>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Asset Info' },
    { id: 'allocations', label: `Allocations (${allocations.length})` },
    { id: 'transfers', label: `Transfers (${transfers.length})` },
    { id: 'timeline', label: `Timeline (${historyTimeline.length})` },
  ];

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={close} />

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="handwriting text-3xl font-bold text-white">{asset.name}</h2>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              asset.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
              asset.status === 'Allocated' || asset.status === 'Assigned' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
              asset.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
              'bg-red-500/10 text-red-400 border border-red-500/25'
            }`}>
              {asset.status}
            </span>
          </div>
          <p className="text-sm text-white/45 mt-1">Asset Code: <span className="font-mono text-white/80">{asset.assetCode}</span> | Category: <span className="text-white/80">{asset.category}</span></p>
        </div>
        <div className="flex gap-2">
          <NavLink to="/allocations" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
            Back to Allocations
          </NavLink>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
              activeTab === tab.id
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-white/55 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left Panel: Specifications */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Specifications</h3>
              <div className="divide-y divide-white/5 text-sm">
                <div className="py-2 flex justify-between">
                  <span className="text-white/45">Asset Code</span>
                  <span className="font-mono font-semibold text-white">{asset.assetCode}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-white/45">Category</span>
                  <span className="text-white font-medium">{asset.category}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-white/45">Current Location</span>
                  <span className="text-white font-medium">{asset.location || 'N/A'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-white/45">Purchase Date</span>
                  <span className="text-white font-medium">
                    {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-white/45">Purchase Price</span>
                  <span className="text-white font-medium">
                    {asset.purchasePrice !== undefined ? `$${asset.purchasePrice.toLocaleString()}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Panel: Notes & Description */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Asset Notes</h3>
              <p className="text-sm text-white/70 leading-relaxed bg-white/5 rounded-xl p-4 border border-white/5 min-h-[140px] whitespace-pre-line">
                {asset.notes || 'No description notes recorded for this asset.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'allocations' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-4">Allocation Record</h3>
            {allocations.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-6">This asset has never been allocated.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/80">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/50">
                      <th className="pb-3 pr-4">Employee</th>
                      <th className="pb-3 pr-4">Department</th>
                      <th className="pb-3 pr-4">Allocation Date</th>
                      <th className="pb-3 pr-4">Expected Return</th>
                      <th className="pb-3 pr-4">Actual Return</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allocations.map((alloc) => (
                      <tr key={alloc._id}>
                        <td className="py-3 pr-4 font-medium text-white">{alloc.employee?.name || 'N/A'}</td>
                        <td className="py-3 pr-4">{alloc.department?.name || 'N/A'}</td>
                        <td className="py-3 pr-4">
                          {new Date(alloc.allocationDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4">
                          {new Date(alloc.expectedReturnDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4">
                          {alloc.actualReturnDate ? new Date(alloc.actualReturnDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            alloc.status === 'Allocated' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                            alloc.status === 'Returned' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                            'bg-red-500/10 text-red-400 border border-red-500/25'
                          }`}>
                            {alloc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transfers' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-4">Transfer History Log</h3>
            {transfers.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-6">No transfers recorded for this asset.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/80">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/50">
                      <th className="pb-3 pr-4">From Owner</th>
                      <th className="pb-3 pr-4">To Owner</th>
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Reason</th>
                      <th className="pb-3 pr-4">Approved By</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transfers.map((tx) => (
                      <tr key={tx._id}>
                        <td className="py-3 pr-4">
                          <div className="text-white/70">{tx.fromEmployee?.name || 'Available / None'}</div>
                          <div className="text-xs text-white/45">{tx.fromDepartment?.name || 'N/A'}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-white">{tx.toEmployee?.name || 'N/A'}</div>
                          <div className="text-xs text-white/45">{tx.toDepartment?.name || 'N/A'}</div>
                        </td>
                        <td className="py-3 pr-4">
                          {new Date(tx.transferDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4 max-w-[150px] truncate" title={tx.reason}>{tx.reason}</td>
                        <td className="py-3 pr-4">{tx.approvedBy?.name || 'System'}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${
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
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-6">Asset Timeline Audit Trail</h3>
            
            {historyTimeline.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-6">No historical actions logged.</p>
            ) : (
              <div className="relative pl-6 border-l border-white/10 space-y-6">
                {historyTimeline.map((item, index) => {
                  const colors = {
                    Created: 'bg-blue-500 border-blue-400',
                    Updated: 'bg-amber-500 border-amber-400',
                    Allocated: 'bg-indigo-500 border-indigo-400',
                    Assigned: 'bg-indigo-500 border-indigo-400',
                    Returned: 'bg-emerald-500 border-emerald-400',
                    Transferred: 'bg-purple-500 border-purple-400',
                    Deleted: 'bg-red-500 border-red-400'
                  };

                  return (
                    <div key={item._id} className="relative group">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-1 h-4.5 w-4.5 rounded-full border-2 ${
                        colors[item.action] || 'bg-white/20 border-white/35'
                      }`} />

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{item.action}</span>
                          <span className="text-[10px] text-white/45">
                            {new Date(item.createdAt).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-white/55 mt-0.5">Performed by: <span className="font-semibold text-white/70">{item.performedBy}</span></p>
                        
                        {item.details && Object.keys(item.details).length > 0 && (
                          <div className="mt-2 text-xs bg-white/5 border border-white/5 rounded-lg p-3 text-white/75 space-y-1">
                            {item.action === 'Transferred' && (
                              <>
                                <div><span className="text-white/45">From:</span> {item.details.fromEmployee} ({item.details.fromDepartment})</div>
                                <div><span className="text-white/45">To:</span> {item.details.toEmployee} ({item.details.toDepartment})</div>
                              </>
                            )}
                            {item.action === 'Allocated' && (
                              <>
                                <div><span className="text-white/45">Assigned To:</span> {item.details.employeeName}</div>
                                <div><span className="text-white/45">Department:</span> {item.details.departmentName}</div>
                              </>
                            )}
                            {item.action === 'Returned' && (
                              <div><span className="text-white/45">Returned On:</span> {new Date(item.details.returnDate).toLocaleDateString()}</div>
                            )}
                            {item.action === 'Updated' && item.details.action && (
                              <div>{item.details.action}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
