import { useEffect } from 'react';

export default function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => onClose(), 3200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const tone = toast.type === 'error' ? 'border-red-400/40 bg-red-500/15 text-red-100' : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100';

  return (
    <div className="fixed right-4 top-4 z-[70] max-w-sm">
      <div className={`rounded-2xl border px-4 py-3 shadow-sketch backdrop-blur ${tone}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{toast.title}</p>
            <p className="mt-1 text-sm opacity-90">{toast.message}</p>
          </div>
          <button type="button" onClick={onClose} className="text-lg leading-none opacity-70 hover:opacity-100">×</button>
        </div>
      </div>
    </div>
  );
}