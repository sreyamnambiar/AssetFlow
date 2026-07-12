const priorityStyles = {
  low: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  medium: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
  high: 'border-red-400/40 bg-red-500/15 text-red-100',
};

export default function PriorityBadge({ priority }) {
  const tone = priorityStyles[priority] || 'border-white/15 bg-white/5 text-white/80';
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}>{priority || 'unknown'}</span>;
}