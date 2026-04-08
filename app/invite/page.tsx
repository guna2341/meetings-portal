'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Building2, Shield, Users, Loader2, CheckCircle, XCircle, Clock, LogIn } from 'lucide-react';

interface InviteDetails {
  email: string;
  role: string;
  expiresAt: string;
  organization?: { name: string; slug: string; logo?: string };
}

type PageState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'valid'; details: InviteDetails }
  | { status: 'invalid'; message: string }
  | { status: 'accepted'; orgName: string; role: string }
  | { status: 'declined' }
  | { status: 'error'; message: string };

function InvitePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [state, setState] = useState<PageState>({ status: 'loading' });
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ status: 'invalid', message: 'No invitation token provided.' });
      return;
    }

    fetch(`/api/invitations/${token}`)
      .then(async (res) => {
        const json = await res.json();
        if (res.status === 401) {
          setState({ status: 'unauthenticated' });
        } else if (!json.success) {
          setState({ status: 'invalid', message: json.message });
        } else {
          setState({ status: 'valid', details: json.data });
        }
      })
      .catch(() => setState({ status: 'error', message: 'Failed to load invitation.' }));
  }, [token]);

  async function respond(action: 'accept' | 'decline') {
    setActing(true);
    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();

      if (res.status === 401) {
        setState({ status: 'unauthenticated' });
        return;
      }

      if (!json.success) {
        setState({ status: 'invalid', message: json.message });
        return;
      }

      if (action === 'accept') {
        setState({
          status: 'accepted',
          orgName: json.data?.organization?.name ?? 'the organization',
          role: json.data?.role ?? 'member',
        });
        // Refresh org context + navigate after 2s
        setTimeout(() => router.push('/organizations'), 2000);
      } else {
        setState({ status: 'declined' });
      }
    } catch {
      setState({ status: 'error', message: 'Something went wrong.' });
    } finally {
      setActing(false);
    }
  }

  const roleIcon = {
    owner: <Shield size={14} className="text-amber-500" />,
    admin: <Shield size={14} className="text-indigo-500" />,
    member: <Users size={14} className="text-slate-400" />,
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="p-8">
            {/* ── Loading ── */}
            {state.status === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-slate-500">Validating invitation…</p>
              </div>
            )}

            {/* ── Unauthenticated ── */}
            {state.status === 'unauthenticated' && (
              <div className="flex flex-col items-center gap-5 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
                  <LogIn className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-900">Sign in to continue</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    You need to be logged in to accept this invitation.
                  </p>
                </div>
                <button
                  id="invite-login-btn"
                  onClick={() =>
                    router.push(`/login?returnUrl=${encodeURIComponent(`/invite?token=${token}`)}`)
                  }
                  className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <LogIn size={16} />
                  Sign in
                </button>
                <p className="text-xs text-slate-400">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() =>
                      router.push(`/register?returnUrl=${encodeURIComponent(`/invite?token=${token}`)}`)
                    }
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    Register
                  </button>
                </p>
              </div>
            )}

            {/* ── Valid Invite ── */}
            {state.status === 'valid' && (
              <div className="flex flex-col gap-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow-sm">
                    {state.details.organization?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">You&apos;re invited!</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Join <span className="font-semibold text-slate-800">{state.details.organization?.name}</span>
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Invited email</span>
                    <span className="font-medium text-slate-800">{state.details.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Role</span>
                    <span className="flex items-center gap-1 font-medium text-slate-800 capitalize">
                      {roleIcon[state.details.role as keyof typeof roleIcon] ?? null}
                      {state.details.role}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Expires</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock size={13} />
                      {new Date(state.details.expiresAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    id="decline-invite-btn"
                    disabled={acting}
                    onClick={() => respond('decline')}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    id="accept-invite-btn"
                    disabled={acting}
                    onClick={() => respond('accept')}
                    className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {acting && <Loader2 size={14} className="animate-spin" />}
                    Accept
                  </button>
                </div>
              </div>
            )}

            {/* ── Accepted ── */}
            {state.status === 'accepted' && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <CheckCircle className="h-14 w-14 text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-900">Welcome aboard!</h2>
                <p className="text-sm text-slate-500">
                  You&apos;ve joined <span className="font-semibold">{state.orgName}</span> as{' '}
                  <span className="capitalize font-semibold">{state.role}</span>.
                </p>
                <p className="text-xs text-slate-400">Redirecting to your organizations…</p>
              </div>
            )}

            {/* ── Declined ── */}
            {state.status === 'declined' && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <XCircle className="h-14 w-14 text-slate-400" />
                <h2 className="text-xl font-bold text-slate-900">Invitation declined</h2>
                <p className="text-sm text-slate-500">
                  You can always ask for a new invitation later.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mt-2 rounded-xl bg-slate-800 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-900 transition"
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {/* ── Invalid / Error ── */}
            {(state.status === 'invalid' || state.status === 'error') && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <XCircle className="h-14 w-14 text-rose-400" />
                <h2 className="text-xl font-bold text-slate-900">Invalid Invitation</h2>
                <p className="text-sm text-slate-500">
                  {state.message}
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mt-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          MeetHub · Organization Invitation
        </p>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <InvitePageContent />
    </Suspense>
  );
}
