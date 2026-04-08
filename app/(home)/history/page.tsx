'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, MapPin, Users, Search, Filter,
  ChevronDown, CheckCircle, XCircle, ArrowRight,
  Building, TrendingUp, BarChart2, Clock3, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attendee {
  name: string;
  email: string;
  status: 'accepted' | 'declined' | 'pending';
}

interface Task {
  title: string;
  assignedTo: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
}

interface Note {
  author: string;
  content: string;
  timestamp: string;
}

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: string;
  location?: string;
  building?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  organizer: { name: string; email: string };
  attendees: Attendee[];
  agenda: string[];
  tasks: Task[];
  notes: Note[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  success: boolean;
  data: Meeting[];
  pagination: Pagination;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  upcoming: 'bg-blue-100 text-blue-700',
};

const LIMIT = 10;

// ─── Custom hook ─────────────────────────────────────────────────────────────

function useMeetings(params: {
  search: string;
  status: string;
  page: number;
}) {
  const [data, setData] = useState<Meeting[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params.status && params.status !== 'all') query.set('status', params.status);
      if (params.search) query.set('search', params.search);
      query.set('page', String(params.page));
      query.set('limit', String(LIMIT));

      const res = await fetch(`/api/meetings?${query.toString()}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error('API returned failure');
      setData(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [params.search, params.status, params.page]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return { data, pagination, loading, error, refetch: fetchMeetings };
}

// ─── Derived stats helper ─────────────────────────────────────────────────────

function useStats(meetings: Meeting[]) {
  const total = meetings.length;
  const completed = meetings.filter((m) => m.status === 'completed').length;
  const cancelled = meetings.filter((m) => m.status === 'cancelled').length;
  const totalTasks = meetings.reduce((s, m) => s + m.tasks.length, 0);
  const completedTasks = meetings.reduce(
    (s, m) => s + m.tasks.filter((t) => t.status === 'completed').length,
    0
  );
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  return { total, completed, cancelled, taskPct };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MeetingHistoryPage() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounce search so we don't fire a request on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  const handleStatusChange = (val: typeof statusFilter) => {
    setStatusFilter(val);
    setPage(1);
  };

  const { data: meetings, pagination, loading, error, refetch } = useMeetings({
    search: debouncedSearch,
    status: statusFilter,
    page,
  });

  const stats = useStats(meetings);

  // Client-side sort (API returns date-sorted; we just flip for 'oldest')
  const sorted = sortBy === 'oldest' ? [...meetings].reverse() : meetings;

  // Group by month
  const groupedByMonth: Record<string, Meeting[]> = {};
  sorted.forEach((m) => {
    const key = new Date(m.date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(m);
  });

  return (
    <div className="h-full overflow-y-auto bg-gray-50 custom-scroll">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meeting History</h1>
            <p className="text-gray-500 text-sm mt-1">
              Browse and review all past meetings, outcomes, and tasks.
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats row — derived from current page data; shown even while loading */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Showing',
              value: pagination ? pagination.total : '—',
              icon: <BarChart2 size={18} className="text-blue-500" />,
              bg: 'bg-blue-50',
            },
            {
              label: 'Completed',
              value: stats.completed,
              icon: <CheckCircle size={18} className="text-green-500" />,
              bg: 'bg-green-50',
            },
            {
              label: 'Cancelled',
              value: stats.cancelled,
              icon: <XCircle size={18} className="text-red-500" />,
              bg: 'bg-red-50',
            },
            {
              label: 'Task Completion',
              value: `${stats.taskPct}%`,
              icon: <TrendingUp size={18} className="text-purple-500" />,
              bg: 'bg-purple-50',
            },
          ].map(({ label, value, icon, bg }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
            >
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

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Search by title, organizer, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as typeof statusFilter)}
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <Clock3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Results count */}
        {!loading && !error && (
          <p className="text-xs text-gray-400 mb-4 px-1">
            Showing{' '}
            <span className="font-semibold text-gray-600">{meetings.length}</span> of{' '}
            <span className="font-semibold text-gray-600">{pagination?.total ?? 0}</span>{' '}
            meeting{(pagination?.total ?? 0) !== 1 ? 's' : ''}
          </p>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500">Loading meetings…</p>
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 flex flex-col items-center gap-3">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm font-medium text-gray-700">Failed to load meetings</p>
            <p className="text-xs text-gray-400">{error}</p>
            <button
              onClick={refetch}
              className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && meetings.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Search size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No meetings found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* ── Grouped list ── */}
        {!loading && !error && meetings.length > 0 && (
          <>
            {Object.entries(groupedByMonth).map(([month, monthMeetings]) => (
              <div key={month} className="mb-8">
                {/* Month label */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400">{month}</h2>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="flex flex-col gap-3">
                  {monthMeetings.map((meeting) => {
                    const isExpanded = expandedId === meeting._id;
                    const completedTasks = meeting.tasks.filter((t) => t.status === 'completed').length;
                    const totalTasks = meeting.tasks.length;
                    const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    const acceptedCount = meeting.attendees.filter((a) => a.status === 'accepted').length;

                    return (
                      <div
                        key={meeting._id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                      >
                        {/* Main row */}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[meeting.status] ?? 'bg-gray-100 text-gray-600'}`}
                                >
                                  {meeting.status}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(meeting.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {meeting.title}
                              </h3>
                              {meeting.description && (
                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                                  {meeting.description}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => router.push(`/dashboard/view/${meeting._id}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                View <ArrowRight size={12} />
                              </button>
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : meeting._id)}
                                className={`p-1.5 rounded-lg border border-gray-200 transition-all ${
                                  isExpanded
                                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                                    : 'text-gray-400 hover:bg-gray-50'
                                }`}
                              >
                                <ChevronDown
                                  size={14}
                                  className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock size={12} className="text-gray-400" />
                              {meeting.time} · {meeting.duration}
                            </span>
                            {meeting.location && (
                              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <MapPin size={12} className="text-gray-400" />
                                {meeting.location}
                              </span>
                            )}
                            {meeting.building && (
                              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Building size={12} className="text-gray-400" />
                                {meeting.building}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Users size={12} className="text-gray-400" />
                              {acceptedCount}/{meeting.attendees.length} attended
                            </span>
                          </div>

                          {/* Task progress bar */}
                          {meeting.status === 'completed' && totalTasks > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400">Task completion</span>
                                <span className="text-xs font-semibold text-gray-600">
                                  {completedTasks}/{totalTasks} tasks · {taskPct}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    taskPct === 100 ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${taskPct}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-5">

                            {/* Agenda */}
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                                Agenda
                              </p>
                              {meeting.agenda.length > 0 ? (
                                <ol className="flex flex-col gap-1.5">
                                  {meeting.agenda.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                                        {i + 1}
                                      </span>
                                      {item}
                                    </li>
                                  ))}
                                </ol>
                              ) : (
                                <p className="text-sm text-gray-400 italic">No agenda items.</p>
                              )}
                            </div>

                            {/* Attendees */}
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                                Attendees
                              </p>
                              <div className="flex flex-col gap-1.5">
                                {meeting.attendees.map((a, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
                                      {a.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                    </div>
                                    <span className="text-sm text-gray-700 flex-1">{a.name}</span>
                                    {a.status === 'accepted' && (
                                      <CheckCircle size={13} className="text-green-500" />
                                    )}
                                    {a.status === 'declined' && (
                                      <XCircle size={13} className="text-red-500" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Notes + Organizer */}
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                                Notes
                              </p>
                              {meeting.notes.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                  {meeting.notes.map((note, i) => (
                                    <div key={i} className="text-sm text-gray-600 leading-relaxed">
                                      <span className="font-medium text-gray-700">{note.author}: </span>
                                      {note.content}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400 italic">No notes recorded.</p>
                              )}

                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                                  Organized by
                                </p>
                                <p className="text-sm text-gray-700 font-medium">
                                  {meeting.organizer.name}
                                </p>
                                <p className="text-xs text-gray-400">{meeting.organizer.email}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* ── Pagination ── */}
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
                  Page{' '}
                  <span className="font-semibold text-gray-700">{pagination.page}</span> of{' '}
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