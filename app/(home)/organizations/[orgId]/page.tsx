'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users, Mail, Shield, Settings, ArrowLeft, Loader2,
  MoreHorizontal, Trash2, Crown, UserCog, Clock, RefreshCw
} from 'lucide-react';
import { useOrg } from '@/src/context/OrgContext';

interface Member {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user?: { _id: string; name?: string; email: string };
}

interface Invite {
  _id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  invitedAt: string;
}

interface OrgDetail {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  role: 'owner' | 'admin' | 'member';
}

export default function OrgDetailPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const router = useRouter();
  const { switchOrg, currentOrg } = useOrg();

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'members' | 'invitations'>('members');
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [orgRes, membersRes, invitesRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}`),
        fetch(`/api/organizations/${orgId}/members`),
        fetch(`/api/organizations/${orgId}/invitations`),
      ]);
      if (orgRes.ok) setOrg((await orgRes.json()).data);
      if (membersRes.ok) setMembers((await membersRes.json()).data ?? []);
      if (invitesRes.ok) setInvites((await invitesRes.json()).data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [orgId]);

  async function removeMember(userId: string) {
    if (!confirm('Remove this member from the organization?')) return;
    const res = await fetch(`/api/organizations/${orgId}/members?userId=${userId}`, {
      method: 'DELETE',
    });
    if (res.ok) loadData();
  }

  async function revokeInvite(inviteId: string) {
    const res = await fetch(`/api/organizations/${orgId}/invitations/${inviteId}`, {
      method: 'DELETE',
    });
    if (res.ok) loadData();
  }

  async function handleDeleteOrg() {
    if (!org || org.role !== 'owner') return;
    
    const confirmation = confirm(
      `CRITICAL ACTION: Are you absolutely sure you want to delete "${org.name}"?\n\nThis will immediately remove access for ALL members. This action is irreversible via the UI.`
    );
    
    if (!confirmation) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        alert('Organization deleted successfully.');
        router.push('/organizations');
        // We might want to refresh the org list in context too
        window.location.reload(); 
      } else {
        const json = await res.json();
        alert(json.message || 'Failed to delete organization.');
      }
    } catch (err) {
      alert('Network error - please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Organization not found or access denied.</p>
        <button onClick={() => router.push('/organizations')} className="text-indigo-600 text-sm underline">
          Back to organizations
        </button>
      </div>
    );
  }

  const canManage = org.role === 'owner' || org.role === 'admin';

  const roleIcon = {
    owner: <Crown size={13} className="text-amber-500" />,
    admin: <Shield size={13} className="text-indigo-500" />,
    member: <Users size={13} className="text-slate-400" />,
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6 lg:p-10 overflow-auto">
      <div className="mx-auto max-w-4xl">

        {/* Back */}
        <button onClick={() => router.push('/organizations')} className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={16} /> Back to Organizations
        </button>

        {/* Header Card */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow-sm">
                {org.name[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
                <p className="text-sm text-slate-400 font-mono">@{org.slug}</p>
                {org.description && <p className="mt-1 text-sm text-slate-500">{org.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentOrg?._id !== orgId && (
                <button
                  id="switch-to-this-org-btn"
                  onClick={() => switchOrg(orgId)}
                  className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition"
                >
                  Switch to this org
                </button>
              )}
              {canManage && (
                <button
                  id="invite-members-btn"
                  onClick={() => router.push(`/organizations/${orgId}/invite`)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
                >
                  <Mail size={14} /> Invite Members
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex gap-6 border-t border-slate-100 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{members.length}</p>
              <p className="text-xs text-slate-400">Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{invites.length}</p>
              <p className="text-xs text-slate-400">Pending Invites</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 capitalize">{org.role}</p>
              <p className="text-xs text-slate-400">Your Role</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
          {(['members', 'invitations'] as const).map((t) => (
            <button
              key={t}
              id={`tab-${t}`}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
              {t === 'invitations' && invites.length > 0 && (
                <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                  {tab === 'invitations' ? invites.length : <span className="text-rose-400">{invites.length}</span>}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Members Tab */}
        {tab === 'members' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {members.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No members found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                    {canManage && <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.userId} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold text-xs shrink-0">
                            {(m.user?.name || m.user?.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{m.user?.name ?? '—'}</p>
                            <p className="text-xs text-slate-400">{m.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 capitalize text-slate-600 font-medium">
                          {roleIcon[m.role]}
                          {m.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="px-5 py-3.5 text-right">
                          {m.role !== 'owner' && (
                            <button
                              id={`remove-member-${m.userId}`}
                              onClick={() => removeMember(m.userId)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Remove member"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Invitations Tab */}
        {tab === 'invitations' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">Pending Invitations</p>
              {canManage && (
                <button
                  id="send-invite-from-detail-btn"
                  onClick={() => router.push(`/organizations/${orgId}/invite`)}
                  className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline"
                >
                  <Mail size={12} /> Send Invite
                </button>
              )}
            </div>
            {invites.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No pending invitations.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Expires</th>
                    {canManage && <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invites.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{inv.email}</td>
                      <td className="px-5 py-3.5 capitalize text-slate-500">{inv.role}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            id={`revoke-invite-${inv._id}`}
                            onClick={() => revokeInvite(inv._id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            Revoke
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {/* Danger Zone */}
        {org.role === 'owner' && (
          <div className="mt-12 mb-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-rose-800">Danger Zone</h2>
            <p className="mt-1 text-sm text-rose-600">
              Permanently delete this organization and all associated data. This action cannot be undone.
            </p>
            <button
              id="delete-org-full-btn"
              disabled={isDeleting}
              onClick={handleDeleteOrg}
              className="mt-4 flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} /> Delete Organization
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
