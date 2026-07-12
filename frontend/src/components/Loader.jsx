export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      <span>{label}</span>
    </div>
  );
}