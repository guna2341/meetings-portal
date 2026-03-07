'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Circle, Clock, AlertCircle, Search, Filter,
  ChevronDown, Calendar, User, ArrowRight, Flag,
  BarChart2, ListTodo, TrendingUp, Users, RefreshCw, Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Interfaces ────────────────────────────────────────────────────────────

interface Task {
  _id: string;
  title: string;
  meetingTitle: string;
  meetingId: string;
  meetingDate: string;
  dueDate: string;
  assignedTo: string;         // ObjectId string
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
}

// ─── Configs ───────────────────────────────────────────────────────────────

const statusConfig = {
  completed:     { label: 'Completed',   color: 'bg-green-100 text-green-700', icon: CheckCircle, iconColor: 'text-green-500' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700',   icon: Clock,       iconColor: 'text-blue-500'  },
  pending:       { label: 'Pending',     color: 'bg-gray-100 text-gray-600',   icon: Circle,      iconColor: 'text-gray-400'  },
};

const priorityConfig = {
  high:   { color: 'bg-red-50 text-red-700',       dot: 'bg-red-500'    },
  medium: { color: 'bg-yellow-50 text-yellow-700',  dot: 'bg-yellow-500' },
  low:    { color: 'bg-green-50 text-green-700',    dot: 'bg-green-500'  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function isOverdue(dueDate: string, status: string) {
  return status !== 'completed' && new Date(dueDate) < new Date();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem('data');
    if (!raw) return '';
    return JSON.parse(raw)?.id ?? '';
  } catch {
    return '';
  }
}

type StatusFilter   = 'all' | 'in-progress' | 'pending' | 'completed';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type GroupBy        = 'none' | 'status' | 'priority' | 'meeting';

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AssignedByMePage() {
  const router = useRouter();

  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [updatingId,   setUpdatingId]   = useState<string | null>(null);
  const [updateError,  setUpdateError]  = useState<string | null>(null);

  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [groupBy,        setGroupBy]        = useState<GroupBy>('none');

  // ── Fetch tasks I assigned to others ──────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res  = await fetch(`/api/assigned-tasks?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch tasks');

      setTasks(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Update task status ─────────────────────────────────────────────────
  // As the organizer/assigner you can also update status on behalf of assignee
  const updateTaskStatus = async (
    taskId:    string,
    meetingId: string,
    newStatus: Task['status']
  ) => {
    setUpdateError(null);

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );
    setUpdatingId(taskId);

    try {
      const res = await fetch(`/api/meetings/${meetingId}/tasks/${taskId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
    } catch (err: unknown) {
      // Roll back on failure
      setUpdateError(err instanceof Error ? err.message : 'Failed to update status');
      fetchTasks();
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────
  const filtered = tasks.filter((t) => {
    const matchStatus   = statusFilter   === 'all' || t.status   === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchStatus && matchPriority;
  });

  const total           = tasks.length;
  const completedCount  = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const overdueCount    = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const completionPct   = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // ── Grouping ───────────────────────────────────────────────────────────
  const grouped: Record<string, Task[]> = {};
  if (groupBy === 'none') {
    grouped['All Assigned Tasks'] = filtered;
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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks I Assigned</h1>
            <p className="text-gray-500 text-sm mt-1">
              Monitor and update progress on tasks you&apos;ve assigned to others.
            </p>
          </div>
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Fetch error */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
            <div className="flex-1"><span className="font-medium">Error: </span>{error}</div>
            <button onClick={fetchTasks} className="text-red-600 hover:underline font-medium shrink-0">Retry</button>
          </div>
        )}

        {/* Update error */}
        {updateError && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-orange-500" />
            <div className="flex-1"><span className="font-medium">Update failed: </span>{updateError}</div>
            <button onClick={() => setUpdateError(null)} className="text-orange-600 hover:underline font-medium shrink-0">Dismiss</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm">Loading assigned tasks…</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Assigned',  value: total,              icon: <ListTodo    size={18} className="text-blue-500"   />, bg: 'bg-blue-50'   },
                { label: 'In Progress',     value: inProgressCount,    icon: <Clock       size={18} className="text-yellow-500" />, bg: 'bg-yellow-50' },
                { label: 'Overdue',         value: overdueCount,       icon: <AlertCircle size={18} className="text-red-500"    />, bg: 'bg-red-50'    },
                { label: 'Completion Rate', value: `${completionPct}%`,icon: <TrendingUp  size={18} className="text-green-500" />, bg: 'bg-green-50'  },
              ].map(({ label, value, icon, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} shrink-0`}>{icon}</div>
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
                <span className="text-sm font-bold text-gray-900">{completedCount}/{total} completed</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <div className="flex items-center gap-4">
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
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  className="bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
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
                  onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
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

            <p className="text-xs text-gray-400 mb-4 px-1">
              Showing <span className="font-semibold text-gray-600">{filtered.length}</span> task{filtered.length !== 1 ? 's' : ''}
            </p>

            {/* Task list */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                <Search size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No tasks found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([groupLabel, groupTasks]) => (
                <div key={groupLabel} className="mb-8">
                  {groupBy !== 'none' && (
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400">{groupLabel}</h2>
                      <span className="text-xs text-gray-400 font-medium bg-gray-100 rounded-full px-2 py-0.5">{groupTasks.length}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {groupTasks.map((task) => {
                      const overdue    = isOverdue(task.dueDate, task.status);
                      const StatusIcon = statusConfig[task.status].icon;
                      const isUpdating = updatingId === task._id;

                      return (
                        <div
                          key={task._id}
                          className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                            isUpdating
                              ? 'opacity-60 pointer-events-none'
                              : task.status === 'completed'
                              ? 'border-gray-100 opacity-80'
                              : overdue
                              ? 'border-red-200'
                              : 'border-gray-100'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Priority bar */}
                            <div className={`w-1 self-stretch rounded-full shrink-0 ${priorityConfig[task.priority].dot}`} />

                            <div className="flex-1 min-w-0">
                              {/* Title row */}
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                    {task.title}
                                  </h3>
                                  {isUpdating && <Loader2 size={12} className="animate-spin text-blue-400" />}
                                  {overdue && !isUpdating && (
                                    <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                      <AlertCircle size={10} /> Overdue
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Priority badge */}
                                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[task.priority].color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig[task.priority].dot}`} />
                                    {task.priority}
                                  </span>

                                  {/* ── Status selector — PATCH /api/meetings/[meetingId]/tasks/[taskId] ── */}
                                  <div className="relative">
                                    <select
                                      value={task.status}
                                      onChange={(e) =>
                                        updateTaskStatus(
                                          task._id,
                                          task.meetingId,
                                          e.target.value as Task['status']
                                        )
                                      }
                                      className={`appearance-none pl-6 pr-5 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${statusConfig[task.status].color}`}
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="in-progress">In Progress</option>
                                      <option value="completed">Completed</option>
                                    </select>
                                    <StatusIcon
                                      size={12}
                                      className={`absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${statusConfig[task.status].iconColor}`}
                                    />
                                    <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                  </div>
                                </div>
                              </div>

                              {/* Meta */}
                              <div className="flex items-center gap-4 mt-2 flex-wrap">
                                <span className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                                  <Calendar size={12} className={overdue ? 'text-red-400' : 'text-gray-400'} />
                                  Due {formatDate(task.dueDate)}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                  <User size={12} />
                                  Assigned to: <span className="font-mono text-gray-300 text-xs ml-1">{task.assignedTo}</span>
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
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}