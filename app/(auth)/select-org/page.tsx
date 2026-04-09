'use client';

import { useOrg } from '@/src/context/OrgContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Building2, 
  ArrowRight, 
  Plus, 
  Loader2, 
  LogOut, 
  Shield, 
  Users 
} from 'lucide-react';

export default function SelectOrgPage() {
  const { orgs, loading, switchOrg, currentOrg } = useOrg();
  const router = useRouter();
  const [selectingId, setSelectingId] = useState<string | null>(null);

  // If already have a currentOrg and just arrived here, maybe they want to switch?
  // But if they just logged in, currentOrg will be null (due to our change in OrgContext)
  // or it might be set by a sticky session cookie.
  
  useEffect(() => {
    if (!loading && orgs.length === 0) {
      // No organizations at all? Go to dashboard to see the onboarding empty state
      router.push('/dashboard');
    }
  }, [loading, orgs, router]);

  const handleSelect = async (orgId: string) => {
    setSelectingId(orgId);
    try {
      await switchOrg(orgId);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to select organization', error);
      setSelectingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('data');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading your workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
             <Building2 className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">MeetHub</span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Select a workspace
            </h1>
            <p className="mt-3 text-lg text-slate-500">
              Welcome back! Choose an organization to get started with your meetings.
            </p>
          </div>

          <div className="space-y-4">
            {orgs.map((org) => (
              <button
                key={org._id}
                onClick={() => handleSelect(org._id)}
                disabled={!!selectingId}
                className={`w-full group relative flex items-center gap-4 p-5 rounded-2xl border-2 bg-white transition-all hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
                  selectingId === org._id 
                    ? 'border-blue-500 ring-4 ring-blue-500/10' 
                    : 'border-white hover:border-blue-100'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-lg">
                  {org.name[0].toUpperCase()}
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                    {org.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {org.role === 'owner' ? <Shield size={10} className="text-amber-500" /> : <Users size={10} />}
                      {org.role}
                    </span>
                    <span className="text-xs text-slate-400">
                      {org.slug}.meethub.com
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3 text-slate-300 group-hover:text-blue-500 transition-all">
                  {selectingId === org._id ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  ) : (
                    <ArrowRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
              </button>
            ))}

            <button
              onClick={() => router.push('/organizations/create')}
              className="w-full mt-6 py-5 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-3 text-slate-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all group"
            >
              <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors">
                <Plus size={20} />
              </div>
              Create a new organization
            </button>
          </div>

          <p className="mt-12 text-center text-sm text-slate-400">
            Work in multiple teams? You can always switch workspaces from your profile settings later.
          </p>
        </div>
      </main>
    </div>
  );
}
