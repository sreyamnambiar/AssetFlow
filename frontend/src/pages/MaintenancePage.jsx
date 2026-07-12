import { useEffect, useState } from 'react';
import {
  createMaintenanceRequest,
  deleteMaintenanceRequest,
  fetchMaintenanceRequests,
  fetchTechnicians,
  updateMaintenanceRequest,
} from '../api/maintenance.js';
import { fetchAssets } from '../api/assets.js';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import Loader from '../components/Loader.jsx';
import MaintenanceForm from '../components/MaintenanceForm.jsx';
import MaintenanceTable from '../components/MaintenanceTable.jsx';
import MaintenanceTimeline from '../components/MaintenanceTimeline.jsx';
import TechnicianAssignModal from '../components/TechnicianAssignModal.jsx';
import ToastNotification from '../components/ToastNotification.jsx';

function useToast() {
  const [toast, setToast] = useState(null);
  return {
    toast,
    notify: (type, title, message) => setToast({ type, title, message }),
    close: () => setToast(null),
  };
}

export default function MaintenancePage() {
  const { toast, notify, close } = useToast();
  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [editingRequest, setEditingRequest] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);

  async function loadAssets() {
    const items = await fetchAssets();
    setAssets(items);
  }

  async function loadTechnicians() {
    try {
      const items = await fetchTechnicians();
      setTechnicians(items);
    } catch {
      setTechnicians([]);
    }
  }

  async function loadRequests() {
    setLoading(true);
    try {
      const response = await fetchMaintenanceRequests({ page, limit: 10, search: search || undefined, status: status || undefined, priority: priority || undefined });
      setRequests(response.data || []);
      setPagination(response.meta || { page: 1, totalPages: 1 });
    } catch (error) {
      notify('error', 'Maintenance not loaded', String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets().catch((error) => notify('error', 'Assets not loaded', String(error)));
    loadTechnicians().catch((error) => notify('error', 'Technicians not loaded', String(error)));
  }, []);

  useEffect(() => {
    loadRequests().catch((error) => notify('error', 'Maintenance not loaded', String(error)));
  }, [page, search, status, priority]);

  async function handleSubmit(form, isEditing) {
    setSaving(true);
    try {
      if (isEditing && editingRequest) {
        await updateMaintenanceRequest(editingRequest._id, form);
        notify('success', 'Request updated', 'The maintenance request has been updated.');
      } else {
        await createMaintenanceRequest(form);
        notify('success', 'Request created', 'The maintenance request has been submitted.');
      }
      setEditingRequest(null);
      await loadRequests();
    } catch (error) {
      notify('error', 'Maintenance failed', String(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleWorkflowAction(request, nextStatus) {
    try {
      if (nextStatus === 'technician_assigned') {
        if (!technicians.length) {
          notify('error', 'No technician available', 'Create or seed a technician user before assigning this request.');
          return;
        }
        setAssignTarget(request);
        return;
      }

      if (nextStatus === 'in_progress' && !request.technician) {
        notify('error', 'Technician required', 'Assign a technician before moving the request into progress.');
        return;
      }

      await updateMaintenanceRequest(request._id, { status: nextStatus, technician: request.technician?._id || request.technician });
      notify('success', 'Workflow updated', `Request moved to ${nextStatus.replace(/_/g, ' ')}.`);
      await loadRequests();
    } catch (error) {
      notify('error', 'Workflow failed', String(error));
    }
  }

  async function confirmAssign(technicianId) {
    if (!assignTarget) return;
    if (!technicianId) {
      notify('error', 'Technician required', 'Please select a technician before assigning the request.');
      return;
    }

    try {
      await updateMaintenanceRequest(assignTarget._id, { status: 'technician_assigned', technician: technicianId });
      notify('success', 'Technician assigned', 'The request has been assigned successfully.');
      setAssignTarget(null);
      await loadRequests();
    } catch (error) {
      notify('error', 'Assignment failed', String(error));
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    try {
      await deleteMaintenanceRequest(cancelTarget._id);
      notify('success', 'Request cancelled', 'The maintenance request was cancelled successfully.');
      setCancelTarget(null);
      await loadRequests();
    } catch (error) {
      notify('error', 'Cancellation failed', String(error));
    }
  }

  return (
    <div className="space-y-6">
      <ToastNotification toast={toast} onClose={close} />
      <ConfirmationModal
        open={Boolean(cancelTarget)}
        title="Cancel maintenance request?"
        message="This will mark the request as cancelled and keep it in history."
        confirmLabel="Cancel request"
        onConfirm={confirmCancel}
        onClose={() => setCancelTarget(null)}
      />
      <TechnicianAssignModal
        open={Boolean(assignTarget)}
        technicians={technicians}
        onConfirm={confirmAssign}
        onClose={() => setAssignTarget(null)}
      />

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="handwriting text-2xl text-white/60">Screen 7</p>
            <h2 className="handwriting text-5xl text-white">Maintenance Management</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/55">Raise maintenance requests, route them through approval stages, and automatically update asset state on approval and resolution.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 lg:w-[62%]">
            <label className="space-y-2">
              <span className="text-sm text-white/65">Search</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issue" className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50" />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/65">Status</span>
              <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="technician_assigned">Technician Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/65">Priority</span>
              <select value={priority} onChange={(event) => { setPriority(event.target.value); setPage(1); }} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50">
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
        <div className="space-y-6">
          <MaintenanceForm assets={assets} initialValues={editingRequest} onSubmit={handleSubmit} onCancelEdit={() => setEditingRequest(null)} loading={saving} />
          {loading ? <Loader label="Loading maintenance data..." /> : null}
        </div>

        <MaintenanceTimeline requests={requests} onAction={handleWorkflowAction} />
      </div>

      <section className="space-y-6">
        <MaintenanceTable items={requests} loading={loading} pagination={pagination} onPageChange={setPage} onEdit={setEditingRequest} onCancel={setCancelTarget} />
      </section>
    </div>
  );
}