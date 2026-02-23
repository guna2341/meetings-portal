'use client';

import { useState } from 'react';
import {
  Calendar, Clock, Users, MapPin, Building, ArrowLeft,
  Plus, Trash2, Save, X, GripVertical, ChevronDown,
  CheckCircle, XCircle, User
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Attendee {
  id: number;
  name: string;
  email: string;
  status: 'accepted' | 'declined' | 'pending';
}

interface Task {
  id: number;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
}

interface Note {
  id: number;
  author: string;
  content: string;
  timestamp: string;
}

interface MeetingDetails {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  building: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  organizer: { name: string; email: string };
  attendees: Attendee[];
  tasks: Task[];
  notes: Note[];
  agenda: string[];
}

const initialMeeting: MeetingDetails = {
  id: 1,
  title: 'Q1 Planning Review',
  description:
    'Quarterly planning and goal setting session for Q1 2026. We will discuss budget allocation, team objectives, key performance indicators, and strategic initiatives for the upcoming quarter.',
  date: '2026-02-20',
  time: '10:00 AM',
  duration: '60 min',
  location: 'Conference Room A',
  building: 'Main Office - 3rd Floor',
  status: 'upcoming',
  organizer: { name: 'John Doe', email: 'john.doe@company.com' },
  attendees: [
    { id: 1, name: 'Sarah Johnson', email: 'sarah.j@company.com', status: 'accepted' },
    { id: 2, name: 'Michael Chen', email: 'michael.c@company.com', status: 'accepted' },
    { id: 3, name: 'Emma Davis', email: 'emma.d@company.com', status: 'pending' },
    { id: 4, name: 'Alex Kumar', email: 'alex.k@company.com', status: 'accepted' },
    { id: 5, name: 'Lisa Wong', email: 'lisa.w@company.com', status: 'declined' },
  ],
  tasks: [
    { id: 1, title: 'Prepare Q1 Budget Report', assignedTo: 'Sarah Johnson', dueDate: '2026-02-19', status: 'in-progress', priority: 'high' },
    { id: 2, title: 'Compile Team KPIs', assignedTo: 'Michael Chen', dueDate: '2026-02-19', status: 'completed', priority: 'high' },
    { id: 3, title: 'Review Strategic Initiatives', assignedTo: 'Emma Davis', dueDate: '2026-02-20', status: 'pending', priority: 'medium' },
  ],
  notes: [
    { id: 1, author: 'John Doe', content: 'Please review the budget proposals before the meeting. Focus on departments with over 20% variance.', timestamp: '2026-02-15 2:30 PM' },
    { id: 2, author: 'Sarah Johnson', content: 'Budget report draft is ready for review. Shared in the drive folder.', timestamp: '2026-02-16 10:15 AM' },
  ],
  agenda: [
    'Opening remarks and objectives',
    'Q4 performance review',
    'Q1 budget allocation discussion',
    'Team goals and KPIs setting',
    'Strategic initiatives presentation',
    'Q&A and open discussion',
    'Action items and next steps',
  ],
};

const inputCls =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';

const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'upcoming': return 'bg-blue-100 text-blue-700';
    case 'completed': return 'bg-green-100 text-green-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getTaskStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-50 text-green-700';
    case 'in-progress': return 'bg-blue-50 text-blue-700';
    case 'pending': return 'bg-gray-50 text-gray-700';
    default: return 'bg-gray-50 text-gray-700';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-50 text-red-700';
    case 'medium': return 'bg-yellow-50 text-yellow-700';
    case 'low': return 'bg-green-50 text-green-700';
    default: return 'bg-gray-50 text-gray-700';
  }
};

export default function MeetingEditPage() {
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingDetails>(initialMeeting);
  const [saved, setSaved] = useState(false);

  const updateField = <K extends keyof MeetingDetails>(key: K, value: MeetingDetails[K]) =>
    setMeeting((m) => ({ ...m, [key]: value }));

  const updateAgendaItem = (i: number, val: string) =>
    setMeeting((m) => { const a = [...m.agenda]; a[i] = val; return { ...m, agenda: a }; });
  const addAgendaItem = () => setMeeting((m) => ({ ...m, agenda: [...m.agenda, ''] }));
  const removeAgendaItem = (i: number) =>
    setMeeting((m) => ({ ...m, agenda: m.agenda.filter((_, idx) => idx !== i) }));

  const updateAttendee = (id: number, field: keyof Attendee, val: string) =>
    setMeeting((m) => ({
      ...m,
      attendees: m.attendees.map((a) => (a.id === id ? { ...a, [field]: val } : a)),
    }));
  const addAttendee = () =>
    setMeeting((m) => ({
      ...m,
      attendees: [...m.attendees, { id: Date.now(), name: '', email: '', status: 'pending' }],
    }));
  const removeAttendee = (id: number) =>
    setMeeting((m) => ({ ...m, attendees: m.attendees.filter((a) => a.id !== id) }));

  const updateTask = (id: number, field: keyof Task, val: string) =>
    setMeeting((m) => ({
      ...m,
      tasks: m.tasks.map((t) => (t.id === id ? { ...t, [field]: val } : t)),
    }));
  const addTask = () =>
    setMeeting((m) => ({
      ...m,
      tasks: [...m.tasks, { id: Date.now(), title: '', assignedTo: '', dueDate: '', status: 'pending', priority: 'medium' }],
    }));
  const removeTask = (id: number) =>
    setMeeting((m) => ({ ...m, tasks: m.tasks.filter((t) => t.id !== id) }));

  const updateNote = (id: number, val: string) =>
    setMeeting((m) => ({
      ...m,
      notes: m.notes.map((n) => (n.id === id ? { ...n, content: val } : n)),
    }));
  const addNote = () =>
    setMeeting((m) => ({
      ...m,
      notes: [...m.notes, { id: Date.now(), author: m.organizer.name, content: '', timestamp: new Date().toLocaleString() }],
    }));
  const removeNote = (id: number) =>
    setMeeting((m) => ({ ...m, notes: m.notes.filter((n) => n.id !== id) }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const acceptedCount = meeting.attendees.filter((a) => a.status === 'accepted').length;
  const declinedCount = meeting.attendees.filter((a) => a.status === 'declined').length;
  const pendingCount = meeting.attendees.filter((a) => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top action bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Meeting
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X size={14} /> Discard
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">Edit Meeting</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(meeting.status)}`}>
              {meeting.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Update the details below and save your changes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT / main content ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Basic Info */}
            <SectionCard title="Basic Information">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelCls}>Meeting Title</label>
                  <input
                    className={inputCls}
                    value={meeting.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Enter meeting title"
                  />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={4}
                    value={meeting.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe the purpose of this meeting"
                  />
                </div>

                {/* Date / Time / Duration / Status */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>
                      <span className="flex items-center gap-1"><Calendar size={11} /> Date</span>
                    </label>
                    <input type="date" className={inputCls} value={meeting.date}
                      onChange={(e) => updateField('date', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>
                      <span className="flex items-center gap-1"><Clock size={11} /> Time</span>
                    </label>
                    <input className={inputCls} value={meeting.time}
                      onChange={(e) => updateField('time', e.target.value)} placeholder="10:00 AM" />
                  </div>
                  <div>
                    <label className={labelCls}>Duration</label>
                    <input className={inputCls} value={meeting.duration}
                      onChange={(e) => updateField('duration', e.target.value)} placeholder="60 min" />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <div className="relative">
                      <select
                        className={`${inputCls} appearance-none pr-8`}
                        value={meeting.status}
                        onChange={(e) => updateField('status', e.target.value as MeetingDetails['status'])}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Location / Building */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>
                      <span className="flex items-center gap-1"><MapPin size={11} /> Location</span>
                    </label>
                    <input className={inputCls} value={meeting.location}
                      onChange={(e) => updateField('location', e.target.value)} placeholder="Conference Room" />
                  </div>
                  <div>
                    <label className={labelCls}>
                      <span className="flex items-center gap-1"><Building size={11} /> Building</span>
                    </label>
                    <input className={inputCls} value={meeting.building}
                      onChange={(e) => updateField('building', e.target.value)} placeholder="Main Office - Floor" />
                  </div>
                </div>

                {/* Organizer */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-3">Organized by</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Name</label>
                      <input className={inputCls} value={meeting.organizer.name}
                        onChange={(e) => updateField('organizer', { ...meeting.organizer, name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input type="email" className={inputCls} value={meeting.organizer.email}
                        onChange={(e) => updateField('organizer', { ...meeting.organizer, email: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Agenda */}
            <SectionCard title="Meeting Agenda">
              <div className="flex flex-col gap-2">
                {meeting.agenda.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <GripVertical size={14} className="text-gray-300 shrink-0 cursor-grab" />
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 shrink-0">
                      {i + 1}
                    </div>
                    <input
                      className={`${inputCls} flex-1`}
                      value={item}
                      onChange={(e) => updateAgendaItem(i, e.target.value)}
                      placeholder={`Agenda item ${i + 1}`}
                    />
                    <button
                      onClick={() => removeAgendaItem(i)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addAgendaItem}
                  className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <Plus size={15} /> Add Agenda Item
                </button>
              </div>
            </SectionCard>

            {/* Tasks */}
            <SectionCard title="Related Tasks">
              <div className="flex flex-col gap-3">
                {meeting.tasks.map((task) => (
                  <div key={task.id} className="group bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                          {task.status.replace('-', ' ')}
                        </span>
                      </div>
                      <button
                        onClick={() => removeTask(task.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className={labelCls}>Task Title</label>
                        <input className={inputCls} value={task.title}
                          onChange={(e) => updateTask(task.id, 'title', e.target.value)} placeholder="Task title" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="col-span-2 sm:col-span-1">
                          <label className={labelCls}>Assigned To</label>
                          <input className={inputCls} value={task.assignedTo}
                            onChange={(e) => updateTask(task.id, 'assignedTo', e.target.value)} placeholder="Name" />
                        </div>
                        <div>
                          <label className={labelCls}>Due Date</label>
                          <input type="date" className={inputCls} value={task.dueDate}
                            onChange={(e) => updateTask(task.id, 'dueDate', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Status</label>
                          <div className="relative">
                            <select className={`${inputCls} appearance-none pr-7`} value={task.status}
                              onChange={(e) => updateTask(task.id, 'status', e.target.value)}>
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Priority</label>
                          <div className="relative">
                            <select className={`${inputCls} appearance-none pr-7`} value={task.priority}
                              onChange={(e) => updateTask(task.id, 'priority', e.target.value)}>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addTask}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <Plus size={15} /> Add Task
                </button>
              </div>
            </SectionCard>

            {/* Notes */}
            <SectionCard title="Meeting Notes">
              <div className="flex flex-col gap-3">
                {meeting.notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                          {note.author.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{note.author}</p>
                          <p className="text-xs text-gray-500">{note.timestamp}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeNote(note.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={3}
                      value={note.content}
                      onChange={(e) => updateNote(note.id, e.target.value)}
                      placeholder="Note content..."
                    />
                  </div>
                ))}
                <button
                  onClick={addNote}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <Plus size={15} /> Add Note
                </button>
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT column ── */}
          <div className="flex flex-col gap-6">

            {/* Attendees */}
            <SectionCard title={`Attendees (${meeting.attendees.length})`}>
              {/* Status summary */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{acceptedCount}</p>
                  <p className="text-xs text-green-600">Accepted</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <p className="text-lg font-bold text-yellow-600">{pendingCount}</p>
                  <p className="text-xs text-yellow-600">Pending</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <p className="text-lg font-bold text-red-600">{declinedCount}</p>
                  <p className="text-xs text-red-600">Declined</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {meeting.attendees.map((attendee) => (
                  <div key={attendee.id} className="group border border-gray-100 rounded-xl p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
                          {attendee.name ? attendee.name.split(' ').map((n) => n[0]).join('') : '?'}
                        </div>
                        {attendee.status === 'accepted' && <CheckCircle size={14} className="text-green-500" />}
                        {attendee.status === 'declined' && <XCircle size={14} className="text-red-500" />}
                        {attendee.status === 'pending' && <User size={14} className="text-gray-400" />}
                      </div>
                      <button
                        onClick={() => removeAttendee(attendee.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <input
                        className={inputCls}
                        value={attendee.name}
                        onChange={(e) => updateAttendee(attendee.id, 'name', e.target.value)}
                        placeholder="Full name"
                      />
                      <input
                        type="email"
                        className={inputCls}
                        value={attendee.email}
                        onChange={(e) => updateAttendee(attendee.id, 'email', e.target.value)}
                        placeholder="Email address"
                      />
                      <div className="relative">
                        <select
                          className={`${inputCls} appearance-none pr-7`}
                          value={attendee.status}
                          onChange={(e) => updateAttendee(attendee.id, 'status', e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="declined">Declined</option>
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addAttendee}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <Plus size={15} /> <Users size={13} /> Add Attendee
                </button>
              </div>
            </SectionCard>

            {/* Meeting Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Meeting Statistics</h3>
              {[
                { label: 'Total Attendees', val: meeting.attendees.length },
                { label: 'Tasks Assigned', val: meeting.tasks.length },
                { label: 'Agenda Items', val: meeting.agenda.length },
                { label: 'Notes Added', val: meeting.notes.length },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{val}</span>
                </div>
              ))}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saved ? '✓ Changes Saved' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}