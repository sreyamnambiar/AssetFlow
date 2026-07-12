const statusStyles = {
  upcoming: 'border-sky-400/40 bg-sky-500/15 text-sky-100',
  ongoing: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
  completed: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  cancelled: 'border-red-400/40 bg-red-500/15 text-red-100',
  pending: 'border-slate-400/40 bg-slate-500/15 text-slate-100',
  approved: 'border-blue-400/40 bg-blue-500/15 text-blue-100',
  technician_assigned: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100',
  in_progress: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
  resolved: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  rejected: 'border-red-400/40 bg-red-500/15 text-red-100',
};

export default function StatusBadge({ status, className = '' }) {
  const label = String(status || '').replace(/_/g, ' ');
  const tone = statusStyles[status] || 'border-white/15 bg-white/5 text-white/80';

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone} ${className}`}>{label}</span>;
}