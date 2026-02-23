'use client';

import { useState } from 'react';
import {
  CheckCircle, Circle, Clock, AlertCircle, Search, Filter,
  ChevronDown, Calendar, User, ArrowRight, Flag,
  BarChart2, ListTodo, TrendingUp, Users, X, Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Task {
  id: number;
  title: string;
  description: string;
  meetingTitle: string;
  meetingId: number;
  dueDate: string;
  assignedTo: string;
  assignedToEmail: string;
  assignedToAvatar: string;
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
}

const assignedTasks: Task[] = [
  {
    id: 1,
    title: 'Prepare Q1 Budget Report',
    description: 'Compile and review department budgets with variance analysis for Q1 planning session.',
    meetingTitle: 'Q1 Planning Review',
    meetingId: 1,
    dueDate: '2026-02-19',
    assignedTo: 'Sarah Johnson',
    assignedToEmail: 'sarah.j@company.com',
    assignedToAvatar: 'SJ',
    status: 'in-progress',
    priority: 'high',
    tags: ['Finance', 'Reporting'],
  },
  {
    id: 2,
    title: 'Compile Team KPIs',
    description: 'Gather KPI data from all team leads and consolidate into the shared dashboard.',
    meetingTitle: 'Q1 Planning Review',
    meetingId: 1,
    dueDate: '2026-02-19',
    assignedTo: 'Michael Chen',
    assignedToEmail: 'michael.c@company.com',
    assignedToAvatar: 'MC',
    status: 'completed',
    priority: 'high',
    tags: ['Analytics'],
  },
  {
    id: 3,
    title: 'Review Strategic Initiatives Deck',
    description: 'Go through the strategic initiatives presentation and provide written feedback.',
    meetingTitle: 'Q1 Planning Review',
    meetingId: 1,
    dueDate: '2026-02-20',
    assignedTo: 'Emma Davis',
    assignedToEmail: 'emma.d@company.com',
    assignedToAvatar: 'ED',
    status: 'pending',
    priority: 'medium',
    tags: ['Strategy'],
  },
  {
    id: 4,
    title: 'Update Product Roadmap v2',
    description: 'Incorporate feedback from the planning session and publish the updated roadmap.',
    meetingTitle: 'Product Roadmap Planning',
    meetingId: 2,
    dueDate: '2026-01-30',
    assignedTo: 'Alex Kumar',
    assignedToEmail: 'alex.k@company.com',
    assignedToAvatar: 'AK',
    status: 'completed',
    priority: 'high',
    tags: ['Product', 'Planning'],
  },
  {
    id: 5,
    title: 'Resource Allocation Spreadsheet',
    description: 'Create the Q1 resource allocation spreadsheet based on decisions from the roadmap session.',
    meetingTitle: 'Product Roadmap Planning',
    meetingId: 2,
    dueDate: '2026-02-01',
    assignedTo: 'Lisa Wong',
    assignedToEmail: 'lisa.w@company.com',
    assignedToAvatar: 'LW',
    status: 'completed',
    priority: 'medium',
    tags: ['Planning', 'Finance'],
  },
  {
    id: 6,
    title: 'Submit Security Policy Form',
    description: 'Sign and submit the updated security compliance acknowledgement form.',
    meetingTitle: 'Security Compliance Briefing',
    meetingId: 6,
    dueDate: '2026-02-17',
    assignedTo: 'Sarah Johnson',
    assignedToEmail: 'sarah.j@company.com',
    assignedToAvatar: 'SJ',
    status: 'in-progress',
    priority: 'high',
    tags: ['Security', 'Compliance'],
  },
  {
    id: 7,
    title: 'Incident Post-Mortem Report',
    description: 'Write a formal post-mortem for the January security incident and distribute to team leads.',
    meetingTitle: 'Security Compliance Briefing',
    meetingId: 6,
    dueDate: '2026-02-14',
    assignedTo: 'Michael Chen',
    assignedToEmail: 'michael.c@company.com',
    assignedToAvatar: 'MC',
    status: 'pending',
    priority: 'high',
    tags: ['Security'],
  },
  {
    id: 8,
    title: 'Draft Q1 Engineering OKRs',
    description: 'Prepare the engineering team OKR proposals for the next planning meeting.',
    meetingTitle: 'Product Roadmap Planning',
    meetingId: 2,
    dueDate: '2026-02-25',
    assignedTo: 'Emma Davis',
    assignedToEmail: 'emma.d@company.com',
    assignedToAvatar: 'ED',
    status: 'pending',
    priority: 'low',
    tags: ['OKRs', 'Planning'],
  },
  {
    id: 9,
    title: 'Update Budget Forecast Spreadsheet',
    description: 'Revise engineering budget forecast based on monthly review decisions.',
    meetingTitle: 'Budget Review - Engineering',
    meetingId: 4,
    dueDate: '2026-02-13',
    assignedTo: 'Alex Kumar',
    assignedToEmail: 'alex.k@company.com',
    assignedToAvatar: 'AK',
    status: 'completed',
    priority: 'medium',
    tags: ['Finance'],
  },
  {
    id: 10,
    title: 'Send Offer Letter to Candidate',
    description: 'Prepare and send the formal offer letter to the selected senior engineer candidate.',
    meetingTitle: 'Hiring Committee - Senior Engineer',
    meetingId: 5,
    dueDate: '2026-02-09',
    assignedTo: 'Lisa Wong',
    assignedToEmail: 'lisa.w@company.com',
    assignedToAvatar: 'LW',
    status: 'completed',
    priority: 'high',
    tags: ['Hiring', 'HR'],
  },
];

const statusConfig = {
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle, iconColor: 'text-green-500' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock, iconColor: 'text-blue-500' },
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-600', icon: Circle, iconColor: 'text-gray-400' },
};

const priorityConfig = {
  high: { color: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  medium: { color: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-500' },
  low: { color: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
};

const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
];

const assigneeColorMap: Record<string, string> = {};
let colorIdx = 0;
function getAvatarColor(name: string) {
  if (!assigneeColorMap[name]) {
    assigneeColorMap[name] = avatarColors[colorIdx % avatarColors.length];
    colorIdx++;
  }
  return assigneeColorMap[name];
}

function isOverdue(dueDate: string, status: string) {
  return status !== 'completed' && new Date(dueDate) < new Date();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type StatusFilter = 'all' | 'in-progress' | 'pending' | 'completed';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type GroupBy = 'none' | 'assignee' | 'status' | 'priority' | 'meeting';

// Pre-seed colors
assignedTasks.forEach((t) => getAvatarColor(t.assignedTo));

export default function AssignedTasksPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [tasks, setTasks] = useState<Task[]>(assignedTasks);

  const uniqueAssignees = Array.from(new Set(tasks.map((t) => t.assignedTo)));

  const updateTaskStatus = (id: number, status: Task['status']) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));

  const filtered = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(search.toLowerCase()) ||
      t.meetingTitle.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchAssignee = assigneeFilter === 'all' || t.assignedTo === assigneeFilter;
    return matchSearch && matchStatus && matchPriority && matchAssignee;
  });

  const total = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const completionPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Assignee breakdown
  const assigneeBreakdown = uniqueAssignees.map((name) => {
    const personTasks = tasks.filter((t) => t.assignedTo === name);
    const done = personTasks.filter((t) => t.status === 'completed').length;
    return { name, total: personTasks.length, done };
  });

  // Grouping
  const grouped: Record<string, Task[]> = {};
  if (groupBy === 'none') {
    grouped['All Assigned Tasks'] = filtered;
  } else if (groupBy === 'assignee') {
    uniqueAssignees.forEach((name) => {
      const items = filtered.filter((t) => t.assignedTo === name);
      if (items.length) grouped[name] = items;
    });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tasks I Assigned</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor progress on tasks you&apos;ve assigned to others across all meetings.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Assigned', value: total, icon: <ListTodo size={18} className="text-blue-500" />, bg: 'bg-blue-50' },
            { label: 'In Progress', value: inProgressCount, icon: <Clock size={18} className="text-yellow-500" />, bg: 'bg-yellow-50' },
            { label: 'Overdue', value: overdueCount, icon: <AlertCircle size={18} className="text-red-500" />, bg: 'bg-red-50' },
            { label: 'Completion Rate', value: `${completionPct}%`, icon: <TrendingUp size={18} className="text-green-500" />, bg: 'bg-green-50' },
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

        {/* Overall progress + assignee breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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
                const cfg = statusConfig[s];
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <cfg.icon size={12} className={cfg.iconColor} />
                    <span className="text-xs text-gray-500">{cfg.label}: <span className="font-semibold text-gray-700">{count}</span></span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assignee breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">By Assignee</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {assigneeBreakdown.map(({ name, total: personTotal, done }) => {
                const pct = personTotal > 0 ? Math.round((done / personTotal) * 100) : 0;
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(name)}`}>
                      {name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-gray-700 truncate">{name}</span>
                        <span className="text-xs text-gray-400 ml-2 shrink-0">{done}/{personTotal}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Search tasks, assignees, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Assignee */}
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="all">All Assignees</option>
              {uniqueAssignees.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Status */}
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

          {/* Priority */}
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

          {/* Group by */}
          <div className="relative">
            <BarChart2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            >
              <option value="none">No Grouping</option>
              <option value="assignee">Group by Assignee</option>
              <option value="status">Group by Status</option>
              <option value="priority">Group by Priority</option>
              <option value="meeting">Group by Meeting</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-gray-400 mb-4 px-1">
          Showing <span className="font-semibold text-gray-600">{filtered.length}</span> task{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Task list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Search size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No tasks found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([groupLabel, groupTasks]) => (
            <div key={groupLabel} className="mb-8">
              {groupBy !== 'none' && (
                <div className="flex items-center gap-3 mb-3">
                  {groupBy === 'assignee' && (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(groupLabel)}`}>
                      {groupLabel.split(' ').map((n) => n[0]).join('')}
                    </div>
                  )}
                  <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400">{groupLabel}</h2>
                  <span className="text-xs text-gray-400 font-medium bg-gray-100 rounded-full px-2 py-0.5">{groupTasks.length}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}

              <div className="flex flex-col gap-3">
                {groupTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const StatusIcon = statusConfig[task.status].icon;

                  return (
                    <div
                      key={task.id}
                      className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                        task.status === 'completed'
                          ? 'border-gray-100 opacity-80'
                          : overdue
                          ? 'border-red-200'
                          : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Assignee avatar */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${getAvatarColor(task.assignedTo)}`}>
                          {task.assignedToAvatar}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {task.title}
                              </h3>
                              {overdue && (
                                <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                  <AlertCircle size={10} /> Overdue
                                </span>
                              )}
                            </div>

                            {/* Right side badges + status changer */}
                            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[task.priority].color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig[task.priority].dot}`} />
                                {task.priority}
                              </span>

                              {/* Status dropdown */}
                              <div className="relative">
                                <select
                                  value={task.status}
                                  onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                                  className={`appearance-none pl-6 pr-5 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${statusConfig[task.status].color}`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                </select>
                                <StatusIcon size={12} className={`absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${statusConfig[task.status].iconColor}`} />
                                <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          </div>

                          <p className={`text-sm mt-1 ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {task.description}
                          </p>

                          {/* Tags */}
                          {task.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {task.tags.map((tag) => (
                                <span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Meta row */}
                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            <span className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                              <Calendar size={12} className={overdue ? 'text-red-400' : 'text-gray-400'} />
                              Due {formatDate(task.dueDate)}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                              <User size={12} className="text-gray-400" />
                              {task.assignedTo}
                              <span className="text-gray-300">·</span>
                              <span className="text-gray-400">{task.assignedToEmail}</span>
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
      </div>
    </div>
  );
}