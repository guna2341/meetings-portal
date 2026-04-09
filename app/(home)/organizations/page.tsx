'use client';

import { useOrg } from '@/src/context/OrgContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, Plus, Mail, ArrowRight, Loader2, Users, Shield, CheckCircle } from 'lucide-react';

interface PendingInvite {
  _id: string;
  email: string;
  role: string;
  expiresAt: string;
  organization?: { _id: string; name: string; slug: string };
}

export default function OrganizationsPage() {
  const { orgs, pendingInvitesCount, loading, currentOrg, switchOrg, refreshOrgs } = useOrg();
  const router = useRouter();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);

  useEffect(() => {
    fetch('/api/invitations')
      .then((r) => r.json())
      .then((d) => setInvites(d.data ?? []))
      .finally(() => setInvitesLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const hasOrgs = orgs.length > 0;

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6 lg:p-10 overflow-auto">
      <div className="mx-auto max-w-4xl">

        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Organizations</h1>
          <p className="mt-2 text-slate-500">
            {hasOrgs
              ? 'Manage your organizations or join a new one.'
              : 'Get started by creating your first organization or accepting an invitation.'}
          </p>
        </div>

        {/* ── Empty state ── */}
        {!hasOrgs && (
          <div className="mb-10 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
              <Building2 className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">No organizations yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Create one to get started or accept a pending invitation below.
            </p>
            <button
              id="create-first-org-btn"
              onClick={() => router.push('/organizations/create')}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 active:scale-95"
            >
              <Plus size={16} />
              Create Organization
            </button>
          </div>
        )}

        {/* ── Orgs Grid ── */}
        {hasOrgs && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Your Organizations</h2>
              <button
                id="create-org-top-btn"
                onClick={() => router.push('/organizations/create')}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                <Plus size={14} />
                New Organization
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orgs.map((org) => (
                <div
                  key={org._id}
                  id={`org-card-${org._id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-indigo-200 cursor-pointer"
                  onClick={() => router.push(`/organizations/${org._id}`)}
                >
                  {currentOrg?._id === org._id && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </div>
                  )}

                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white shadow-sm">
                    {org.name[0].toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-slate-900 truncate">{org.name}</h3>
                  <p className="mt-0.5 text-xs capitalize text-slate-400">{org.role}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      {org.role === 'owner' && <Shield size={12} className="text-amber-500" />}
                      {org.role === 'admin' && <Users size={12} className="text-indigo-400" />}
                      <span className="capitalize">{org.role}</span>
                    </div>
                    <button
                      id={`switch-org-${org._id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        switchOrg(org._id);
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        currentOrg?._id === org._id
                          ? 'bg-emerald-100 text-emerald-700 cursor-default'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {currentOrg?._id === org._id ? 'Current' : 'Switch'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Pending Invitations ── */}
        {(pendingInvitesCount > 0 || !invitesLoading) && invites.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Mail size={18} className="text-rose-500" />
                Pending Invitations
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                  {invites.length}
                </span>
              </h2>
            </div>

            <div className="space-y-3">
              {invites.map((inv) => (
                <div
                  key={inv._id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 font-bold text-sm shrink-0">
                      {inv.organization?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        {inv.organization?.name ?? 'Unknown Organization'}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        Invited as{' '}
                        <span className="font-semibold text-slate-600">{inv.role}</span>
                        {' · '}Expires{' '}
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    id={`view-invite-${inv._id}`}
                    onClick={() => router.push(`/invite?id=${inv._id}`)}
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:underline font-medium shrink-0"
                  >
                    View <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
