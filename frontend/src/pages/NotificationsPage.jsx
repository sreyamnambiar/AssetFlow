import { useEffect, useState } from 'react';
import Loader from '../components/Loader.jsx';
import ToastNotification from '../components/ToastNotification.jsx';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../api/notifications.js';

function useToast() {
  const [toast, setToast] = useState(null);
  const notify = (type, title, message) => setToast({ type, title, message });
  const close = () => setToast(null);
  return { toast, notify, close };
}

const TABS = [
  { id: 'All', label: 'All' },
  { id: 'Alert', label: 'Alerts' },
  { id: 'Approval', label: 'Approvals' },
  { id: 'Booking', label: 'Bookings' },
];

export default function NotificationsPage() {
  const { toast, notify, close } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  async function loadNotifications(pageNum = 1, type = activeTab) {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: 10 };
      if (type !== 'All') params.type = type;
      
      const res = await fetchNotifications(params);
      setNotifications(res.data || []);
      setPage(res.meta.page);
      setTotalPages(res.meta.totalPages);
      setTotalCount(res.meta.total);
    } catch (e) {
      notify('error', 'Failed to load notifications', String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications(1, activeTab);
  }, [activeTab]);

  async function handleMarkRead(id) {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      notify('error', 'Error', 'Failed to mark as read');
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      notify('success', 'Success', 'All notifications marked as read');
    } catch (e) {
      notify('error', 'Error', 'Failed to mark all as read');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await deleteNotification(id);
      notify('success', 'Deleted', 'Notification removed');
      loadNotifications(page, activeTab);
    } catch (e) {
      notify('error', 'Error', 'Failed to delete notification');
    }
  }

  function getIcon(type) {
    switch (type) {
      case 'Alert': return '🚨';
      case 'Approval': return '✅';
      case 'Booking': return '📅';
      default: return '📩';
    }
  }

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={close} />

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm shadow-sketch flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="handwriting text-5xl text-white">Notifications</h2>
          <p className="mt-2 text-sm text-white/55">
            View alerts, approvals, and system events.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleMarkAllRead} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
            Mark All as Read
          </button>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`rounded-xl border px-5 py-2 text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-emerald-400/50 bg-emerald-900/30 text-emerald-100'
                : 'border-white/10 bg-[#0f0f0f] text-white/60 hover:border-white/20 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        {loading ? (
          <div className="py-12"><Loader label="Loading notifications…" /></div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-white/50">No notifications found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className={`flex items-start gap-4 rounded-2xl border p-4 transition ${
                n.is_read ? 'border-white/5 bg-[#0f0f0f] opacity-75' : 'border-emerald-500/20 bg-emerald-900/10'
              }`}>
                <div className="flex-shrink-0 text-2xl mt-1">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                    <h4 className="text-base font-semibold text-white truncate">{n.title}</h4>
                    <span className="text-xs text-white/40 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-white/70">{n.message}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-1">
                      Mark Read
                    </button>
                  )}
                  <button onClick={() => handleDelete(n.id)} className="text-xs text-red-400 hover:text-red-300 p-1">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs text-white/50">Showing {notifications.length} of {totalCount}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => loadNotifications(page - 1)}
                className="rounded-xl border border-white/10 bg-[#0f0f0f] px-3 py-1.5 text-xs text-white disabled:opacity-30"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => loadNotifications(page + 1)}
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
