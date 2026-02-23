'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Circle, Clock, AlertCircle, Search, Filter,
  ChevronDown, Calendar, Users, ArrowRight, Flag,
  BarChart2, ListTodo, TrendingUp, Zap, Loader2, RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Interfaces ────────────────────────────────────────────────────────────

interface Task {
  _id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  meetingStatus: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────

// TODO: replace with your real auth/session user id
const CURRENT_USER_ID = 'YOUR_USER_ID';

const statusConfig = {
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700', icon: CheckCircle, iconColor: 'text-green-500' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700',  icon: Clock,        iconColor: 'text-blue-500'  },
  pending:     { label: 'Pending',     color: 'bg-gray-100 text-gray-600',   icon: Circle,       iconColor: 'text-gray-400'  },
};

const priorityConfig = {
  high:   { color: 'bg-red-50 text-red-700',      dot: 'bg-red-500'    },
  medium: { color: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-500' },
  low:    { color: 'bg-green-50 text-green-700',   dot: 'bg-green-500'  },
};

type StatusFilter   = 'all' | 'in-progress' | 'pending' | 'completed';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type GroupBy        = 'none' | 'status' | 'priority' | 'meeting';

// ─── Helpers ───────────────────────────────────────────────────────────────

function isOverdue(dueDate: string, status: string) {
  return status !== 'completed' && new Date(dueDate) < new Date();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function MyTasksPage() {
  const router = useRouter();

  // ── API state ────────────────────────────────────────────────────────────
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(1);

  // ── Filter / group state ─────────────────────────────────────────────────
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [groupBy, setGroupBy]               = useState<GroupBy>('none');

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        userId: CURRENT_USER_ID,
        page:   String(page),
        limit:  '50', // load all for client-side grouping/search
      });
      if (statusFilter   !== 'all') q.set('status',   statusFilter);
      if (priorityFilter !== 'all') q.set('priority', priorityFilter);

      const res  = await fetch(`/api/tasks?${q}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? 'API error');

      setTasks(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Reset page when server-side filters change
  const handleStatusChange = (val: StatusFilter) => {
    setStatusFilter(val);
    setPage(1);
  };
  const handlePriorityChange = (val: PriorityFilter) => {
    setPriorityFilter(val);
    setPage(1);
  };

  // ── Client-side search (on top of server results) ────────────────────────
  const filtered = tasks.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.meetingTitle.toLowerCase().includes(q) ||
      t.assignedTo.toLowerCase().includes(q)
    );
  });

  // ── Stats ────────────────────────────────────────────────────────────────
  const total          = pagination?.total ?? tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const overdueCount   = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const completionPct  = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // ── Grouping ─────────────────────────────────────────────────────────────
  const grouped: Record<string, Task[]> = {};
  if (groupBy === 'none') {
    grouped['All Tasks'] = filtered;
  } else if (groupBy === 'status') {
    (['in-progress', 'pending', 'completed'] as Task['status'][]).forEach((s) => {
      const items = filtered.filter((t) => t.status === s);
      if (items.length) grouped[statusConfig[s].label] = items;
    });
  } else if (groupBy === 'priority') {
    (['high', 'medium', 'low'] as Task['priority'][]).forEach((p) => {
      const items = filtered.filter((t) => t.priority === p);
      if (items.length) grouped[`${p.charAt(0).toUpperCase() + p.slice(1)} Priority`] = items;
    });
  } else if (groupBy === 'meeting') {
    filtered.forEach((t) => {
      if (!grouped[t.meetingTitle]) grouped[t.meetingTitle] = [];
      grouped[t.meetingTitle].push(t);
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-500 text-sm mt-1">
              Track and manage tasks assigned to you across all meetings.
            </p>
          </div>
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tasks',      value: total,          icon: <ListTodo    size={18} className="text-blue-500"   />, bg: 'bg-blue-50'   },
            { label: 'In Progress',      value: inProgressCount, icon: <Zap         size={18} className="text-yellow-500" />, bg: 'bg-yellow-50' },
            { label: 'Overdue',          value: overdueCount,   icon: <AlertCircle size={18} className="text-red-500"    />, bg: 'bg-red-50'    },
            { label: 'Completion Rate',  value: `${completionPct}%`, icon: <TrendingUp  size={18} className="text-green-500"  />, bg: 'bg-green-50'  },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-gray-900">
              {completedCount} of {tasks.length} tasks completed
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-3">
            {(['completed', 'in-progress', 'pending'] as Task['status'][]).map((s) => {
              const count = tasks.filter((t) => t.status === s).length;
              const cfg   = statusConfig[s];
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <cfg.icon size={12} className={cfg.iconColor} />
                  <span className="text-xs text-gray-500">
                    {cfg.label}: <span className="font-semibold text-gray-700">{count}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Search tasks or meetings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as StatusFilter)}
            >
              <option value="all">All Statuses</option>
              <option value="in-progress">In Progress</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <Flag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={priorityFilter}
              onChange={(e) => handlePriorityChange(e.target.value as PriorityFilter)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <BarChart2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            >
              <option value="none">No Grouping</option>
              <option value="status">Group by Status</option>
              <option value="priority">Group by Priority</option>
              <option value="meeting">Group by Meeting</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Results count */}
        {!loading && !error && (
          <p className="text-xs text-gray-400 mb-4 px-1">
            Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{' '}
            <span className="font-semibold text-gray-600">{total}</span> task{total !== 1 ? 's' : ''}
          </p>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-3">
            <Loader2 size={28} className="text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500">Loading tasks…</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 flex flex-col items-center gap-3">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm font-medium text-gray-700">Failed to load tasks</p>
            <p className="text-xs text-gray-400">{error}</p>
            <button
              onClick={fetchTasks}
              className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Search size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No tasks found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* ── Task list ── */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {Object.entries(grouped).map(([groupLabel, groupTasks]) => (
              <div key={groupLabel} className="mb-8">
                {groupBy !== 'none' && (
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400">{groupLabel}</h2>
                    <span className="text-xs text-gray-400 font-medium bg-gray-100 rounded-full px-2 py-0.5">
                      {groupTasks.length}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {groupTasks.map((task) => {
                    const overdue    = isOverdue(task.dueDate, task.status);
                    const StatusIcon = statusConfig[task.status].icon;

                    return (
                      <div
                        key={task._id}
                        className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                          task.status === 'completed'
                            ? 'border-gray-100 opacity-75'
                            : overdue
                            ? 'border-red-200'
                            : 'border-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Status icon */}
                          <div className={`mt-0.5 shrink-0 ${statusConfig[task.status].iconColor}`}>
                            <StatusIcon size={20} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`text-sm font-semibold ${
                                  task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
                                }`}>
                                  {task.title}
                                </h3>
                                {overdue && (
                                  <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                    <AlertCircle size={10} /> Overdue
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[task.priority].color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig[task.priority].dot}`} />
                                  {task.priority}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[task.status].color}`}>
                                  {statusConfig[task.status].label}
                                </span>
                              </div>
                            </div>

                            {/* Meta row */}
                            <div className="flex items-center gap-4 mt-3 flex-wrap">
                              <span className={`flex items-center gap-1.5 text-xs ${
                                overdue ? 'text-red-500 font-semibold' : 'text-gray-500'
                              }`}>
                                <Calendar size={12} className={overdue ? 'text-red-400' : 'text-gray-400'} />
                                Due {formatDate(task.dueDate)}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Users size={12} className="text-gray-400" />
                                Assigned to {task.assignedTo}
                              </span>
                              <button
                                onClick={() => router.push(`/meetings/${task.meetingId}`)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                              >
                                {task.meetingTitle} <ArrowRight size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-xs text-gray-400">
                  Page <span className="font-semibold text-gray-700">{pagination.page}</span> of{' '}
                  <span className="font-semibold text-gray-700">{pagination.totalPages}</span>
                </span>
                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}