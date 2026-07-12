import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard',           to: '#' },
  { label: 'Organization setup',  to: '#' },
  { label: 'Assets',              to: '#' },
  { label: 'Allocation & Transfer', to: '#' },
  { label: 'Resource Booking',    to: '/resource-booking' },
  { label: 'Maintenance',         to: '/maintenance' },
  { label: 'Audit',               to: '/audit' },
  { label: 'Reports',             to: '/reports' },
  { label: 'Notifications',       to: '/notifications' },
  { label: 'Activity Logs',       to: '/activity-logs' },
];

export default function ModuleLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen px-3 py-3 text-white sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="panel-frame mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1540px] overflow-hidden">
        <aside className={`absolute inset-y-0 left-0 z-40 w-[270px] transform border-r border-white/15 bg-[#121212] p-5 transition-transform duration-300 lg:static lg:translate-x-0 lg:border-r lg:bg-transparent ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="mb-8 flex items-center justify-between lg:block">
            <div>
              <h1 className="handwriting text-4xl font-semibold text-white">AssetFlow</h1>
            </div>
            <button type="button" className="rounded-xl border border-white/15 px-3 py-2 text-sm lg:hidden" onClick={() => setOpen(false)}>Close</button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) =>
              item.to === '#' ? (
                <span key={item.label} className="block rounded-2xl border border-transparent px-4 py-2 text-sm text-white/70">
                  {item.label}
                </span>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-2xl border px-4 py-2 text-sm transition ${isActive
                      ? 'border-emerald-300/60 bg-emerald-900/40 text-emerald-50'
                      : 'border-transparent text-white/80 hover:border-white/10 hover:bg-white/5'
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col border-l border-white/15 lg:border-l-0">
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
            <div>
              <button type="button" onClick={() => setOpen(true)} className="mr-3 rounded-xl border border-white/15 px-3 py-2 text-sm lg:hidden">Menu</button>
              <span className="handwriting text-2xl text-white/80">Enterprise Asset &amp; Resource Management</span>
            </div>
            <div className="hidden items-center gap-4 sm:flex">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">Module 3</div>
              {localStorage.getItem('token') ? (
                <button 
                  onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
                >
                  Sign Out
                </button>
              ) : (
                <NavLink 
                  to="/login"
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/20"
                >
                  Sign In
                </NavLink>
              )}
            </div>
          </header>

          <main className="relative flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
            <Outlet />
          </main>
        </div>
      </div>

      {open ? <button aria-label="Close sidebar overlay" type="button" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/60 lg:hidden" /> : null}
    </div>
  );
}