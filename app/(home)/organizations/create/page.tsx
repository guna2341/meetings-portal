'use client';

import { useOrg } from '@/src/context/OrgContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateOrganizationPage() {
  const { refreshOrgs } = useOrg();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function deriveSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message ?? 'Failed to create organization');
        return;
      }

      await refreshOrgs();
      router.push(`/organizations/${json.data._id}`);
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  }

  const slug = deriveSlug(name);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6 lg:p-10 overflow-auto">
      <div className="mx-auto max-w-lg">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <Building2 className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Create Organization</h1>
              <p className="text-sm text-slate-500">You'll automatically become the owner</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="org-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Organization Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="org-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                disabled={loading}
                maxLength={100}
              />
              {slug && (
                <p className="mt-1.5 text-xs text-slate-400">
                  Slug: <span className="font-mono font-medium text-slate-600">{slug}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="org-desc" className="mb-1.5 block text-sm font-medium text-slate-700">
                Description <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="org-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this organization do?"
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                disabled={loading}
                maxLength={500}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="submit-create-org-btn"
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating…' : 'Create Organization'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
