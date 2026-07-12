import { useEffect, useState } from 'react';
import Loader from '../components/Loader.jsx';
import ToastNotification from '../components/ToastNotification.jsx';
import {
  fetchUtilization,
  fetchIdleAssets,
  fetchMaintenanceReport,
  fetchDepartmentSummary,
  fetchHeatmap,
  fetchRetirement,
  fetchMostUsed,
} from '../api/reports.js';

function useToast() {
  const [toast, setToast] = useState(null);
  const notify = (type, title, message) => setToast({ type, title, message });
  const close = () => setToast(null);
  return { toast, notify, close };
}

/* ── SVG Bar Chart ──────────────────────────────────────────── */
function BarChart({ data, valueKey = 'utilization', labelKey = 'name', colorFn }) {
  if (!data?.length) return <EmptyChart />;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  const W = 500, H = 160, PAD = 32, barW = Math.max(12, Math.floor((W - PAD * 2) / data.length) - 6);

  const defColor = (i) => `hsl(${150 + i * 28},40%,38%)`;
  const getColor = colorFn || defColor;

  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full">
      {/* Gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = PAD + (1 - f) * (H - PAD);
        return <line key={f} x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max(4, ((d[valueKey] || 0) / max) * (H - PAD));
        const x = PAD + i * ((W - PAD * 2) / data.length) + ((W - PAD * 2) / data.length - barW) / 2;
        const y = H - barH;
        const label = String(d[labelKey] || '').slice(0, 8);
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill={getColor(i)} opacity="0.85" />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)">{label}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.65)">{d[valueKey]}</text>
          </g>
        );
      })}
      {/* X-axis */}
      <line x1={PAD} x2={W - PAD} y1={H} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  );
}

/* ── SVG Line Chart ─────────────────────────────────────────── */
function LineChart({ data, valueKey = 'count', labelKey = 'label' }) {
  if (!data?.length) return <EmptyChart />;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  const W = 500, H = 160, PAD = 32;
  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1 || 1)) * (W - PAD * 2);
    const y = PAD + (1 - (d[valueKey] || 0) / max) * (H - PAD * 1.5);
    return [x, y];
  });
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `${PAD},${H} ` + pts.map(([x, y]) => `${x},${y}`).join(' ') + ` ${W - PAD},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = PAD + (1 - f) * (H - PAD * 1.5);
        return <line key={f} x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
      })}
      <polygon points={area} fill="rgba(200,100,150,0.10)" />
      <polyline points={polyline} fill="none" stroke="#c87098" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#c87098" />
          <text x={x} y={H + 14} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)">{data[i][labelKey]}</text>
          <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.65)">{data[i][valueKey]}</text>
        </g>
      ))}
      <line x1={PAD} x2={W - PAD} y1={H} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
  );
}

/* ── Heatmap Grid ───────────────────────────────────────────── */
function HeatmapGrid({ grid, days, hours }) {
  if (!grid?.length) return <EmptyChart />;
  const maxVal = Math.max(...grid.flat(), 1);
  const slicedHours = hours ? hours.filter((_, i) => i % 3 === 0) : [];

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div style={{ minWidth: 480 }}>
        {/* Hour labels */}
        <div className="flex mb-1 ml-8">
          {hours?.filter((_, i) => i % 3 === 0).map((h, i) => (
            <div key={i} className="text-[9px] text-white/35 flex-1 text-center">{h}</div>
          ))}
        </div>
        {grid.map((row, di) => (
          <div key={di} className="flex items-center gap-0.5 mb-0.5">
            <div className="text-[9px] text-white/40 w-7 shrink-0">{days?.[di]}</div>
            {row.filter((_, i) => i % 3 === 0).map((val, hi) => {
              const intensity = val / maxVal;
              const bg = `rgba(52, 211, 153, ${0.04 + intensity * 0.75})`;
              return (
                <div key={hi} title={`${days?.[di]} ${hours?.[hi * 3]}: ${val} bookings`}
                  className="flex-1 rounded-sm h-5 transition hover:ring-1 hover:ring-emerald-400/50"
                  style={{ background: bg }} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-28 rounded-2xl border border-white/5 bg-[#0f0f0f]">
      <p className="text-xs text-white/35">No data available yet</p>
    </div>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm ${className}`}>
      <h3 className="handwriting text-xl text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const { toast, notify, close } = useToast();
  const [loading, setLoading]         = useState(true);
  const [utilization, setUtilization] = useState(null);
  const [idle, setIdle]               = useState([]);
  const [maintenance, setMaintenance] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [heatmap, setHeatmap]         = useState(null);
  const [retirement, setRetirement]   = useState(null);
  const [mostUsed, setMostUsed]       = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [u, i, m, d, h, r, mu] = await Promise.allSettled([
          fetchUtilization(),
          fetchIdleAssets(),
          fetchMaintenanceReport(),
          fetchDepartmentSummary(),
          fetchHeatmap(),
          fetchRetirement(),
          fetchMostUsed(),
        ]);
        if (u.status === 'fulfilled') setUtilization(u.value);
        if (i.status === 'fulfilled') setIdle(i.value || []);
        if (m.status === 'fulfilled') setMaintenance(m.value);
        if (d.status === 'fulfilled') setDepartments(d.value || []);
        if (h.status === 'fulfilled') setHeatmap(h.value);
        if (r.status === 'fulfilled') setRetirement(r.value);
        if (mu.status === 'fulfilled') setMostUsed(mu.value || []);
      } catch (e) {
        notify('error', 'Failed to load reports', String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader label="Loading reports…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={close} />

      {/* Header */}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
        <h2 className="handwriting text-5xl text-white">Reports &amp; Analytics</h2>
        <p className="mt-2 text-sm text-white/55 max-w-2xl">
          Asset utilization, maintenance trends, booking heatmap, idle assets, and retirement forecasts.
        </p>
      </section>

      {/* Row 1 — Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Utilization by Department">
          <BarChart
            data={utilization?.categories || []}
            valueKey="utilization"
            labelKey="name"
          />
          {utilization && (
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/50">
              <span>Total assets: <strong className="text-white/80">{utilization.totalAssets}</strong></span>
              {Object.entries(utilization.statusSummary || {}).map(([k, v]) => (
                <span key={k}>{k.replace('_', ' ')}: <strong className="text-white/70">{v}</strong></span>
              ))}
            </div>
          )}
        </Card>

        <Card title="Maintenance Frequency">
          <LineChart
            data={maintenance?.monthly || []}
            valueKey="count"
            labelKey="label"
          />
          {maintenance && (
            <p className="mt-2 text-[11px] text-white/45">
              Total requests: <strong className="text-white/70">{maintenance.totalRequests}</strong>
            </p>
          )}
        </Card>
      </div>

      {/* Row 2 — Most Used + Idle */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Most Used Assets">
          {mostUsed.length === 0 ? (
            <p className="text-sm text-white/40 py-4 text-center">No booking data available.</p>
          ) : (
            <div className="space-y-2">
              {mostUsed.slice(0, 6).map((a, i) => (
                <div key={a.assetId} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/30 w-4 text-center font-semibold">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-white leading-tight">
                        {a.assetCode ? `${a.assetCode} — ` : ''}{a.name}
                      </p>
                      <p className="text-[11px] text-white/40">{a.category} · {a.location}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-300 bg-emerald-900/20 border border-emerald-500/20 rounded-full px-2 py-0.5">
                    {a.bookingCount} bookings
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Idle Assets">
          {idle.length === 0 ? (
            <p className="text-sm text-white/40 py-4 text-center">All assets are actively used.</p>
          ) : (
            <div className="space-y-2">
              {idle.slice(0, 6).map((a) => (
                <div key={String(a._id)} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-white leading-tight">
                      {a.assetCode ? `${a.assetCode} — ` : ''}{a.name}
                    </p>
                    <p className="text-[11px] text-white/40">{a.category} · {a.location}</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-300 bg-amber-900/20 border border-amber-500/20 rounded-full px-2 py-0.5">
                    {a.idleDays === null ? 'Never booked' : `Idle ${a.idleDays}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Row 3 — Department Summary */}
      <Card title="Department Allocation Summary">
        {departments.length === 0 ? (
          <p className="text-sm text-white/40 py-4 text-center">No department data available.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0f0f0f] scrollbar-thin">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/45">
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-center">Assets in Audit</th>
                  <th className="px-4 py-3 text-center">Active Cycles</th>
                  <th className="px-4 py-3 text-center">Closed Cycles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {departments.map((d, i) => (
                  <tr key={i} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-medium text-white">{d.department}</td>
                    <td className="px-4 py-3 text-center text-white/70">{d.assetCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">{d.activeCycles}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">{d.closedCycles}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Row 4 — Booking Heatmap */}
      <Card title="Resource Booking Heatmap (Last 30 Days)">
        {heatmap ? (
          <>
            <HeatmapGrid grid={heatmap.grid} days={heatmap.days} hours={heatmap.hours} />
            <div className="mt-3 flex items-center gap-3 text-[11px] text-white/40">
              <div className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: 'rgba(52,211,153,0.07)' }} />
                Low
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: 'rgba(52,211,153,0.45)' }} />
                Medium
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: 'rgba(52,211,153,0.79)' }} />
                High
              </div>
              <span className="ml-auto">Total: {heatmap.totalBookings} bookings</span>
            </div>
          </>
        ) : <EmptyChart />}
      </Card>

      {/* Row 5 — Retirement + Due Maintenance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Assets Nearing Retirement">
          {retirement?.nearRetirement?.length === 0 || !retirement ? (
            <p className="text-sm text-white/40 py-4 text-center">No assets nearing retirement.</p>
          ) : (
            <div className="space-y-2">
              {retirement.nearRetirement.slice(0, 5).map((a) => (
                <div key={String(a._id)} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-white">{a.assetCode ? `${a.assetCode} — ` : ''}{a.name}</p>
                    <p className="text-[11px] text-white/40">{a.category} · {a.location}</p>
                  </div>
                  <span className="text-xs font-semibold text-red-300 bg-red-900/20 border border-red-500/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                    {a.ageYears}y old
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Assets Due for Maintenance">
          {retirement?.dueMaintenance?.length === 0 || !retirement ? (
            <p className="text-sm text-white/40 py-4 text-center">No pending maintenance requests.</p>
          ) : (
            <div className="space-y-2">
              {retirement.dueMaintenance.slice(0, 5).map((m) => (
                <div key={String(m._id)} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-white">{m.assetCode ? `${m.assetCode} — ` : ''}{m.assetName}</p>
                    <p className="text-[11px] text-white/40 line-clamp-1">{m.issueDescription}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-[10px] font-semibold uppercase rounded-full border px-2 py-0.5 ${
                      m.priority === 'High'   ? 'border-red-500/40 text-red-300' :
                      m.priority === 'Medium' ? 'border-amber-400/40 text-amber-300' :
                                               'border-white/20 text-white/50'
                    }`}>{m.priority}</span>
                    <p className="text-[10px] text-white/35 mt-0.5">{m.daysPending}d pending</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Most maintained assets */}
      {maintenance?.topAssets?.length > 0 && (
        <Card title="Most Maintained Assets">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0f0f0f] scrollbar-thin">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/45">
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3 text-center">Maintenance Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {maintenance.topAssets.map((a, i) => (
                  <tr key={i} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-medium text-white">
                      {a.assetCode ? `${a.assetCode} — ` : ''}{a.name}
                    </td>
                    <td className="px-4 py-3 text-center text-amber-300 font-semibold">{a.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
