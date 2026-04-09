'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface OrgSummary {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  role: 'owner' | 'admin' | 'member';
}

interface OrgContextValue {
  orgs: OrgSummary[];
  currentOrg: OrgSummary | null;
  pendingInvitesCount: number;
  loading: boolean;
  switchOrg: (orgId: string) => Promise<void>;
  refreshOrgs: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue>({
  orgs: [],
  currentOrg: null,
  pendingInvitesCount: 0,
  loading: true,
  switchOrg: async () => {},
  refreshOrgs: async () => {},
});

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [currentOrg, setCurrentOrg] = useState<OrgSummary | null>(null);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshOrgs = useCallback(async () => {
    try {
      const [orgsRes, invitesRes] = await Promise.all([
        fetch('/api/organizations'),
        fetch('/api/invitations'),
      ]);

      if (orgsRes.ok) {
        const json = await orgsRes.json();
        const orgList: OrgSummary[] = json.data ?? [];
        setOrgs(orgList);
        
        // Restore currentOrg from session if not already set manually
        if (json.activeOrgId) {
          const active = orgList.find(o => o._id === json.activeOrgId);
          if (active) {
            setCurrentOrg(active);
          }
        }
      }

      if (invitesRes.ok) {
        const json = await invitesRes.json();
        setPendingInvitesCount(json.data?.length ?? 0);
      }
    } catch (err) {
      console.error('OrgContext: failed to refresh orgs', err);
    } finally {
      setLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    refreshOrgs();
  }, []);

  const switchOrg = useCallback(
    async (orgId: string) => {
      const res = await fetch('/api/auth/switch-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });

      if (res.ok) {
        const found = orgs.find((o) => o._id === orgId) ?? null;
        setCurrentOrg(found);
      }
    },
    [orgs]
  );

  return (
    <OrgContext.Provider
      value={{ orgs, currentOrg, pendingInvitesCount, loading, switchOrg, refreshOrgs }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
