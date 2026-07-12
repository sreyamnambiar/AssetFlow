import { useEffect, useState } from 'react';

const emptyForm = {
  assetId: '',
  issueDescription: '',
  priority: 'medium',
  imageFile: null,
};

export default function MaintenanceForm({ assets = [], initialValues = null, onSubmit, onCancelEdit, loading = false }) {
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!initialValues) {
      setForm(emptyForm);
      setPreview('');
      return;
    }

    setForm({
      assetId: initialValues.assetId?._id || initialValues.assetId || '',
      issueDescription: initialValues.issueDescription || '',
      priority: initialValues.priority || 'medium',
      imageFile: null,
    });
    setPreview(initialValues.image || '');
  }, [initialValues]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    updateField('imageFile', file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form, Boolean(initialValues));
    if (!initialValues) {
      setForm(emptyForm);
      setPreview('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-sketch backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="handwriting text-3xl text-white">Raise Maintenance Request</h3>
          <p className="mt-1 text-sm text-white/55">Capture the issue and set its priority.</p>
        </div>
        {initialValues ? (
          <button type="button" onClick={onCancelEdit} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/5">Cancel Edit</button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm text-white/70">Asset</span>
          <select value={form.assetId} onChange={(event) => updateField('assetId', event.target.value)} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50">
            <option value="">Select an asset</option>
            {assets.map((asset) => (
              <option key={asset._id} value={asset._id}>
                {asset.assetCode ? `${asset.assetCode} - ` : ''}{asset.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm text-white/70">Issue Description</span>
          <textarea rows="4" value={form.issueDescription} onChange={(event) => updateField('issueDescription', event.target.value)} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50" placeholder="Describe the fault, visible damage, or symptom" />
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/70">Priority</span>
          <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)} className="w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-white/70">Image Upload</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full rounded-2xl border border-white/15 bg-[#0f0f0f] px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-50 hover:file:bg-emerald-800" />
        </label>

        {preview ? (
          <div className="md:col-span-2">
            <span className="mb-2 block text-sm text-white/70">Preview</span>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <img src={preview} alt="Maintenance preview" className="h-48 w-full object-cover" />
            </div>
          </div>
        ) : null}
      </div>

      <button type="submit" disabled={loading} className="mt-5 inline-flex items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-900/70 px-5 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? 'Saving...' : initialValues ? 'Update Request' : 'Submit Request'}
      </button>
    </form>
  );
}