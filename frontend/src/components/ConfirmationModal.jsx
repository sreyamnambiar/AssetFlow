export default function ConfirmationModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onClose, tone = 'danger' }) {
  if (!open) return null;

  const confirmClasses = tone === 'danger' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-white/15 bg-[#111] p-6 shadow-sketch">
        <h3 className="handwriting text-3xl text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-white/75">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${confirmClasses}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}