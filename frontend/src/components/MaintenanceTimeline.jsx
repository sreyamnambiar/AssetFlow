import PriorityBadge from './PriorityBadge.jsx';
import StatusBadge from './StatusBadge.jsx';

const lanes = ['pending', 'approved', 'technician_assigned', 'in_progress', 'resolved'];

const laneTitles = {
  pending: 'Pending',
  approved: 'Approved',
  technician_assigned: 'Technician Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export default function MaintenanceTimeline({ requests = [], onAction }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
      <div>
        <h3 className="handwriting text-3xl text-white">Maintenance Workflow</h3>
        <p className="mt-1 text-sm text-white/55">Approval workflow as a kanban board.</p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-5">
        {lanes.map((lane) => {
          const laneItems = requests.filter((request) => request.status === lane || (lane === 'approved' && request.status === 'approved'));
          return (
            <div key={lane} className="min-h-[360px] rounded-3xl border border-white/10 bg-[#0f0f0f] p-4">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-white/75">{laneTitles[lane]}</h4>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/65">{laneItems.length}</span>
              </div>

              <div className="space-y-3">
                {laneItems.length ? laneItems.map((request) => (
                  <article key={request._id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/85">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{request.assetId?.assetCode || request.assetId?.name || 'Asset'}</p>
                        <p className="mt-1 text-xs text-white/55">{request.issueDescription}</p>
                      </div>
                      <PriorityBadge priority={request.priority} />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <StatusBadge status={request.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {request.status === 'pending' ? (
                        <>
                          <button type="button" onClick={() => onAction(request, 'approved')} className="rounded-xl border border-emerald-400/30 bg-emerald-900/50 px-3 py-2 text-xs font-semibold text-emerald-50">Approve</button>
                          <button type="button" onClick={() => onAction(request, 'rejected')} className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">Reject</button>
                        </>
                      ) : null}

                      {request.status === 'approved' ? (
                        <button type="button" onClick={() => onAction(request, 'technician_assigned')} className="rounded-xl border border-cyan-400/30 bg-cyan-900/40 px-3 py-2 text-xs font-semibold text-cyan-50">Assign Technician</button>
                      ) : null}

                      {request.status === 'technician_assigned' ? (
                        <button type="button" onClick={() => onAction(request, 'in_progress')} className="rounded-xl border border-amber-400/30 bg-amber-900/40 px-3 py-2 text-xs font-semibold text-amber-50">Start Work</button>
                      ) : null}

                      {request.status === 'in_progress' ? (
                        <button type="button" onClick={() => onAction(request, 'resolved')} className="rounded-xl border border-emerald-400/30 bg-emerald-900/50 px-3 py-2 text-xs font-semibold text-emerald-50">Resolve</button>
                      ) : null}
                    </div>
                  </article>
                )) : <p className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-white/40">No items in this stage.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}