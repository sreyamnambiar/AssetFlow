import PriorityBadge from './PriorityBadge.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function MaintenanceTable({ items = [], loading = false, pagination = {}, onPageChange, onEdit, onCancel }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="handwriting text-3xl text-white">Maintenance History</h3>
          <p className="mt-1 text-sm text-white/55">A full audit trail of maintenance requests.</p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-4 py-3 font-semibold">Asset</th>
                <th className="px-4 py-3 font-semibold">Issue</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-8 text-white/60" colSpan="5">Loading maintenance requests...</td></tr>
              ) : items.length ? items.map((item) => (
                <tr key={item._id} className="border-t border-white/10 text-white/85">
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{item.assetId?.name || 'Unknown Asset'}</div>
                    <div className="text-xs text-white/45">{item.assetId?.assetCode || item.assetId?._id}</div>
                  </td>
                  <td className="px-4 py-4 max-w-md">
                    <p className="overflow-hidden text-ellipsis text-white/80">{item.issueDescription}</p>
                  </td>
                  <td className="px-4 py-4"><PriorityBadge priority={item.priority} /></td>
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => onEdit(item)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/5">Edit</button>
                      <button type="button" onClick={() => onCancel(item)} className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/20">Cancel</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td className="px-4 py-8 text-white/60" colSpan="5">No maintenance requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
        <span>Page {pagination.page || 1} of {pagination.totalPages || 1}</span>
        <div className="flex gap-2">
          <button type="button" disabled={(pagination.page || 1) <= 1} onClick={() => onPageChange((pagination.page || 1) - 1)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 disabled:opacity-40">Previous</button>
          <button type="button" disabled={(pagination.page || 1) >= (pagination.totalPages || 1)} onClick={() => onPageChange((pagination.page || 1) + 1)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 disabled:opacity-40">Next</button>
        </div>
      </div>
    </section>
  );
}