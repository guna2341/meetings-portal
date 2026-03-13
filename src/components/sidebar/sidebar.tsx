
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Plus, History, CheckSquare, Users, Settings, Bell, LogOut, ChevronRight, LucideIcon } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  route: string;
}

interface SidebarProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications/count');
        const json = await res.json();
        if (json.success) setPendingCount(json.pendingCount);
      } catch (e) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const navigationItems: NavigationItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'Overview of meetings',
      route: '/dashboard'
    },
    { 
      id: 'create', 
      label: 'Create Meeting', 
      icon: Plus,
      description: 'Schedule new meeting',
      route: '/create-meet'
    },
    { 
      id: 'history', 
      label: 'Meeting History', 
      icon: History,
      description: 'Past meetings',
      route: '/history'
    },
    { 
      id: 'tasks-assigned', 
      label: 'My tasks',
      icon: CheckSquare,
      description: 'Tasks Assigned to Me', 
      route: '/my-tasks'
    },
    { 
      id: 'tasks-i-assigned', 
      label: 'Assigned tasks', 
      icon: Users,
      description: 'Tasks for others',
      route: '/assigned-tasks'
    },
  ];

  const handleNavigation = (route: string) => {
    router.push(route);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen?.(false);
    }
  };

  function handleLogout() {
    router.replace("/login");
    localStorage.clear();
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen?.(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.route;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.route)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 group
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <h3 className="text-xs font-semibold text-gray-700 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Today&apos;s Meetings</span>
                <span className="font-semibold text-blue-600">2</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pending Tasks</span>
                <span className="font-semibold text-orange-600">5</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold text-purple-600">8</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button 
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors relative"
            onClick={() => handleNavigation('/dashboard')}
          >
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium">Notifications</span>
            {pendingCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                {pendingCount}
              </span>
            )}
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
