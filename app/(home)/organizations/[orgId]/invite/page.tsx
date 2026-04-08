'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Mail, ArrowLeft, Loader2, Copy, Check, Send, AlertTriangle } from 'lucide-react';

type OrgRole = 'admin' | 'member';

interface InviteResult {
  inviteUrl: string;
  email: string;
  emailSent: boolean;
  emailError?: string;
  orgName?: string;
}

export default function InvitePage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!email.trim()) { setError('Email is required'); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message ?? 'Failed to send invitation');
        return;
      }
      setResult({
        inviteUrl: json.data.inviteUrl,
        email: json.data.email,
        emailSent: json.data.emailSent,
        emailError: json.data.emailError,
        orgName: json.data.orgName,
      });
      setEmail('');
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6 lg:p-10 overflow-auto">
      <div className="mx-auto max-w-lg">

        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <Mail className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Invite Member</h1>
              <p className="text-sm text-slate-500">An email will be sent to their Gmail inbox</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="invite-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@gmail.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="invite-role" className="mb-1.5 block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as OrgRole)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                disabled={loading}
              >
                <option value="member">Member — limited access</option>
                <option value="admin">Admin — manage users &amp; invites</option>
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              id="send-invite-submit-btn"
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {loading ? 'Sending…' : 'Send Invitation Email'}
            </button>
          </form>

          {/* ── Result card ── */}
          {result && (
            <div className="mt-6 space-y-3">

              {/* Email sent confirmation */}
              {result.emailSent ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="mb-1 text-sm font-semibold text-emerald-800 flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-600" />
                    Email delivered to {result.email}
                  </p>
                  <p className="text-xs text-emerald-700">
                    The invitation email has been sent to their Gmail inbox. The link expires in 48 hours.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-1 text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600" />
                    Email delivery failed — share the link manually
                  </p>
                  {result.emailError && (
                    <p className="text-xs text-amber-700 font-mono mb-1">{result.emailError}</p>
                  )}
                  <p className="text-xs text-amber-700">
                    Check that GMAIL_USER and GMAIL_APP_PASS are set correctly in your .env file.
                  </p>
                </div>
              )}

              {/* Link fallback — always shown */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Invite Link
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs text-slate-700 truncate font-mono">
                    {result.inviteUrl}
                  </code>
                  <button
                    id="copy-invite-link-btn"
                    onClick={copyLink}
                    className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 transition shrink-0"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Gmail App Password hint */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">📌 Gmail Setup (one-time)</p>
          <p>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">myaccount.google.com/apppasswords</a> → Generate an App Password → Add it to <code className="font-mono bg-slate-100 px-1 rounded">.env</code> as <code className="font-mono bg-slate-100 px-1 rounded">GMAIL_APP_PASS</code>.</p>
        </div>
      </div>
    </div>
  );
}
