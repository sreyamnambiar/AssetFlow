import { useEffect, useState } from 'react';

export default function TechnicianAssignModal({ open, technicians = [], onConfirm, onClose }) {
  const [technicianId, setTechnicianId] = useState('');

  useEffect(() => {
    if (open) {
      setTechnicianId(technicians[0]?._id || '');
    }
  }, [open, technicians]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-white/15 bg-[#111] p-6 shadow-sketch">
        <h3 className="handwriting text-3xl text-white">Assign Technician</h3>
        <p className="mt-3 text-sm leading-6 text-white/75">Select a technician for the approved maintenance request.</p>

        <label className="mt-5 block space-y-2">
          <span className="text-sm text-white/70">Technician</span>
          <select value={technicianId} onChange={(event) => setTechnicianId(event.target.value)} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50">
            <option value="">Select technician</option>
            {technicians.map((technician) => (
              <option key={technician._id} value={technician._id}>
                {technician.name} {technician.role ? `(${technician.role})` : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">Cancel</button>
          <button type="button" onClick={() => onConfirm(technicianId)} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">Assign</button>
        </div>
      </div>
    </div>
  );
}