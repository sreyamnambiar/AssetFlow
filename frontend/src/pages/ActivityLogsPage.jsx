import { useEffect, useState } from 'react';
import Loader from '../components/Loader.jsx';
import ToastNotification from '../components/ToastNotification.jsx';
import { fetchActivityLogs } from '../api/activityLogs.js';

function useToast() {
  const [toast, setToast] = useState(null);
  const notify = (type, title, message) => setToast({ type, title, message });
  const close = () => setToast(null);
  return { toast, notify, close };
}

export default function ActivityLogsPage() {
  const { toast, notify, close } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    user: '',
    module: '',
    date: '',
    search: ''
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  async function loadLogs(pageNum = 1) {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: 15 };
      if (filters.user) params.user = filters.user;
      if (filters.module) params.module = filters.module;
      if (filters.date) params.date = filters.date;
      if (filters.search) params.search = filters.search;
      
      const res = await fetchActivityLogs(params);
      setLogs(res.data || []);
      setPage(res.meta.page);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch (e) {
      notify('error', 'Failed to load logs', String(e));
    } finally {
      setLoading(false);
    }
  }

  // Reload when filters change (debounce simple search visually if needed, here we just use effect)
  useEffect(() => {
    loadLogs(1);
  }, [filters]);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={close} />

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm shadow-sketch">
        <h2 className="handwriting text-5xl text-white">Activity Logs</h2>
        <p className="mt-2 text-sm text-white/55">
          System-wide audit trail for user actions and events.
        </p>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Search Action / Desc</label>
            <input 
              type="text" 
              name="search" 
              value={filters.search} 
              onChange={handleFilterChange} 
              placeholder="Search..."
              className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 transition" 
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Filter by Module</label>
            <select 
              name="module" 
              value={filters.module} 
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 transition appearance-none cursor-pointer"
            >
              <option value="">All Modules</option>
              <option value="Assets">Assets</option>
              <option value="Bookings">Bookings</option>
              <option value="Transfers">Transfers</option>
              <option value="Auth">Auth</option>
              <option value="Audit">Audit</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Filter by Date</label>
            <input 
              type="date" 
              name="date" 
              value={filters.date} 
              onChange={handleFilterChange} 
              className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 transition" 
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => setFilters({ user: '', module: '', date: '', search: '' })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        {loading ? (
          <div className="py-12"><Loader label="Loading logs…" /></div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-white/5 bg-[#0f0f0f]">
            <p className="text-sm text-white/50">No activity logs found for the given filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0f0f0f] scrollbar-thin">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/50">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-white/60 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">{log.user_id?.name || 'Unknown'}</span>
                      <br />
                      <span className="text-[10px] text-white/40">{log.user_id?.role || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-emerald-300 text-xs font-medium">
                      {log.module}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white/90">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-sm">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs text-white/50">Showing {logs.length} of {totalCount}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => loadLogs(page - 1)}
                className="rounded-xl border border-white/10 bg-[#0f0f0f] px-3 py-1.5 text-xs text-white disabled:opacity-30"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => loadLogs(page + 1)}
                className="rounded-xl border border-white/10 bg-[#0f0f0f] px-3 py-1.5 text-xs text-white disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
