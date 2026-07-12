import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { fetchDashboardStats } from '../api/dashboard.js';
import Loader from '../components/Loader.jsx';
import ToastNotification from '../components/ToastNotification.jsx';

function useToast() {
  const [toast, setToast] = useState(null);
  const notify = (type, title, message) => setToast({ type, title, message });
  const close = () => setToast(null);
  return { toast, notify, close };
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast, notify, close } = useToast();

  useEffect(() => {
    fetchDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => notify('error', 'Error Loading Dashboard', err.message || String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label="Loading dashboard stats..." />
      </div>
    );
  }

  const counts = stats?.counts || {
    totalAssets: 0,
    allocatedAssets: 0,
    availableAssets: 0,
    returnedAssets: 0,
    maintenanceAssets: 0,
    totalTransfers: 0,
    totalDepartments: 0,
  };

  const statusBreakdown = stats?.charts?.statusBreakdown || [];
  const departmentBreakdown = stats?.charts?.departmentBreakdown || [];
  const allocationsOverTime = stats?.charts?.allocationsOverTime || [];
  const transfersOverTime = stats?.charts?.transfersOverTime || [];
  const recentAllocations = stats?.recentAllocations || [];

  // Card configuration
  const cardItems = [
    { label: 'Total Assets', value: counts.totalAssets, color: 'border-blue-500/30 bg-blue-500/5 text-blue-400' },
    { label: 'Available Assets', value: counts.availableAssets, color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
    { label: 'Allocated Assets', value: counts.allocatedAssets, color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400' },
    { label: 'Returned Assets', value: counts.returnedAssets, color: 'border-teal-500/30 bg-teal-500/5 text-teal-400' },
    { label: 'Under Maintenance', value: counts.maintenanceAssets, color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
    { label: 'Total Transfers', value: counts.totalTransfers, color: 'border-purple-500/30 bg-purple-500/5 text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={close} />
      
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="handwriting text-3xl font-bold text-white">Asset Allocation &amp; Transfer Dashboard</h2>
          <p className="text-sm text-white/50">Overview of organizational asset distribution, allocations, and transfer trends.</p>
        </div>
        <div className="flex gap-2">
          <NavLink to="/allocations" className="rounded-xl border border-emerald-500/30 bg-emerald-900/30 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-800/40">
            Manage Allocations
          </NavLink>
          <NavLink to="/transfers" className="rounded-xl border border-purple-500/30 bg-purple-900/30 px-4 py-2 text-sm text-purple-400 hover:bg-purple-800/40">
            Transfer Asset
          </NavLink>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cardItems.map((card, i) => (
          <div key={i} className={`rounded-2xl border p-4 shadow-sm transition hover:scale-105 ${card.color}`}>
            <span className="block text-xs font-semibold uppercase tracking-wider opacity-60">{card.label}</span>
            <span className="mt-2 block text-3xl font-bold tracking-tight">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Department Distribution (Bar Chart) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white/80">Active Allocations by Department</h3>
          {departmentBreakdown.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-white/40">No active allocations to display.</div>
          ) : (
            <div className="space-y-3">
              {departmentBreakdown.map((item, index) => {
                const maxCount = Math.max(...departmentBreakdown.map(d => d.count), 1);
                const percent = (item.count / maxCount) * 100;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs text-white/60">
                      <span>{item.department}</span>
                      <span className="font-semibold text-white">{item.count} assets</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-indigo-500/80 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Asset Status Breakdown (Horizontal Stacked Bar/Pie-Alternative) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white/80">Asset Lifecycle &amp; Status Breakdown</h3>
          <div className="space-y-4">
            <div className="flex h-5 w-full overflow-hidden rounded-full bg-white/5">
              {statusBreakdown.map((item, index) => {
                const total = statusBreakdown.reduce((sum, item) => sum + item.count, 0) || 1;
                const width = (item.count / total) * 100;
                const colors = [
                  'bg-emerald-500', // Available
                  'bg-indigo-500',  // Allocated
                  'bg-amber-500',   // Maintenance
                  'bg-red-500',     // Retired
                  'bg-purple-500',  // Other
                ];
                return (
                  <div
                    key={index}
                    title={`${item.status}: ${item.count}`}
                    className={`${colors[index % colors.length]} h-full transition-all hover:brightness-110`}
                    style={{ width: `${width}%` }}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {statusBreakdown.map((item, index) => {
                const colors = [
                  'bg-emerald-500',
                  'bg-indigo-500',
                  'bg-amber-500',
                  'bg-red-500',
                  'bg-purple-500',
                ];
                return (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className={`h-2.5 w-2.5 rounded-full ${colors[index % colors.length]}`} />
                    <span className="text-white/60">{item.status}:</span>
                    <span className="font-semibold text-white">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Allocations Over Time (Bar Chart) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white/80">Allocations Over Time (Last 6 Months)</h3>
          {allocationsOverTime.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-white/40">No allocation trends.</div>
          ) : (
            <div className="flex h-48 items-end gap-3 pt-4">
              {allocationsOverTime.map((item, index) => {
                const max = Math.max(...allocationsOverTime.map(d => d.count), 1);
                const heightPercent = (item.count / max) * 100;
                return (
                  <div key={index} className="group relative flex flex-1 flex-col items-center gap-2">
                    <span className="absolute -top-6 text-[10px] font-bold text-emerald-400 opacity-0 transition group-hover:opacity-100">
                      {item.count}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-emerald-500/30 border border-emerald-400/20 hover:bg-emerald-500/50 transition-all duration-300"
                      style={{ height: `${Math.max(8, heightPercent)}%` }}
                    />
                    <span className="text-[10px] text-white/50">{item.month.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transfers Over Time (Line Chart / SVG Line graph) */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white/80">Transfers Over Time (Last 6 Months)</h3>
          {transfersOverTime.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-white/40">No transfer trends.</div>
          ) : (
            <div className="relative pt-6">
              <svg viewBox="0 0 500 160" className="w-full overflow-visible">
                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
                  const y = 20 + (1 - f) * 120;
                  return (
                    <line key={i} x1="30" x2="470" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  );
                })}
                {/* Dots & Line */}
                {(() => {
                  const max = Math.max(...transfersOverTime.map(d => d.count), 1);
                  const pts = transfersOverTime.map((d, i) => {
                    const x = 30 + (i / 5) * 440;
                    const y = 140 - (d.count / max) * 120;
                    return { x, y, val: d.count };
                  });
                  const pathStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaStr = `${pathStr} L ${pts[pts.length - 1].x} 140 L ${pts[0].x} 140 Z`;

                  return (
                    <>
                      {/* Gradient Fill */}
                      <path d={areaStr} fill="url(#purpleGrad)" opacity="0.15" />
                      {/* Stroke Line */}
                      <path d={pathStr} fill="none" stroke="#a855f7" strokeWidth="2.5" />
                      {/* Dots */}
                      {pts.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#a855f7" stroke="#0b0b0b" strokeWidth="1.5" className="cursor-pointer" />
                          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.85)" fontWeight="bold">
                            {p.val}
                          </text>
                        </g>
                      ))}
                      <defs>
                        <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </>
                  );
                })()}
              </svg>
              <div className="mt-3 flex justify-between px-3 text-[10px] text-white/50">
                {transfersOverTime.map((d, i) => (
                  <span key={i}>{d.month.split(' ')[0]}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Allocations Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80">Recent Asset Allocations</h3>
          <NavLink to="/allocations" className="text-xs text-indigo-400 hover:underline">
            View All
          </NavLink>
        </div>
        
        {recentAllocations.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-white/40">No recent allocations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/80">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/50">
                  <th className="pb-3 pr-4">Asset</th>
                  <th className="pb-3 pr-4">Employee</th>
                  <th className="pb-3 pr-4">Department</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentAllocations.map((alloc) => (
                  <tr key={alloc._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4">
                      <div>
                        <div className="font-semibold text-white">{alloc.asset?.name || 'Unknown Asset'}</div>
                        <div className="text-xs text-white/45">{alloc.asset?.assetCode}</div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{alloc.employee?.name || 'Unknown User'}</td>
                    <td className="py-3 pr-4">{alloc.department?.name || 'N/A'}</td>
                    <td className="py-3 pr-4">
                      {new Date(alloc.allocationDate).toLocaleDateString(undefined, {
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
                      <NavLink to={`/assets/${alloc.asset?._id}`} className="text-xs text-indigo-400 hover:underline">
                        Details
                      </NavLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
