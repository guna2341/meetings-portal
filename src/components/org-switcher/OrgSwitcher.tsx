'use client';

import { useOrg } from '@/src/context/OrgContext';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Plus, Check } from 'lucide-react';

export default function OrgSwitcher() {
  const { orgs, currentOrg, pendingInvitesCount, switchOrg, loading } = useOrg();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (loading) {
    return (
      <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-200" />
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        id="org-switcher-btn"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
      >
        <Building2 size={15} className="text-indigo-500 shrink-0" />
        <span className="max-w-[120px] truncate">
          {currentOrg?.name ?? 'Select Organization'}
        </span>
        {pendingInvitesCount > 0 && (
          <span className="flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold w-4 h-4 shrink-0">
            {pendingInvitesCount}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl animate-in fade-in slide-in-from-top-2">
          {orgs.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No organizations yet</p>
          ) : (
            <>
              <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Your Organizations
              </p>
              {orgs.map((org) => (
                <button
                  key={org._id}
                  id={`org-option-${org._id}`}
                  onClick={async () => {
                    await switchOrg(org._id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-600 font-semibold text-xs">
                    {org.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-slate-800">{org.name}</p>
                    <p className="text-[11px] capitalize text-slate-400">{org.role}</p>
                  </div>
                  {currentOrg?._id === org._id && (
                    <Check size={14} className="text-indigo-500 shrink-0" />
                  )}
                </button>
              ))}
              <div className="my-2 border-t border-slate-100" />
            </>
          )}

          <button
            id="create-org-btn"
            onClick={() => {
              router.push('/organizations/create');
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 font-medium"
          >
            <Plus size={14} />
            Create New Organization
          </button>

          {pendingInvitesCount > 0 && (
            <button
              id="view-invites-btn"
              onClick={() => {
                router.push('/organizations');
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-medium"
            >
              <span className="flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold w-4 h-4">
                {pendingInvitesCount}
              </span>
              Pending Invitations
            </button>
          )}
        </div>
      )}
    </div>
  );
}
