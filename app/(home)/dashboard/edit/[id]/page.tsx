'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Clock, Users, MapPin, Building, ArrowLeft,
  Plus, Trash2, Save, X, GripVertical, ChevronDown,
  CheckCircle, XCircle, User, Loader2, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface Attendee {
  _id: string;
  name: string;
  email: string;
  status: 'accepted' | 'declined' | 'pending';
}

interface Task {
  _id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'pending';
  priority: 'high' | 'medium' | 'low';
}

interface Note {
  _id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface MeetingDetails {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  building: string;
  meetingLink?: string;
  meetingType: 'online' | 'offline' | 'hybrid';
  status: 'upcoming' | 'completed' | 'cancelled';
  organizer: { name: string; email: string; userId?: string };
  attendees: Attendee[];
  tasks: Task[];
  notes: Note[];
  agenda: string[];
}

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
  const params = useParams();
  const id = params.id as string;

  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/meetings/${id}`);
        const json = await res.json();
        if (json.success) {
          // Format date for the input
          const formattedData = {
            ...json.data,
            date: new Date(json.data.date).toISOString().split('T')[0],
            tasks: json.data.tasks?.map((t: any) => ({
              ...t,
              dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : ''
            })) || []
          };
          setMeeting(formattedData);
        } else {
          setError(json.message || 'Failed to load meeting');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMeeting();
  }, [id]);

  const updateField = <K extends keyof MeetingDetails>(key: K, value: MeetingDetails[K]) =>
    setMeeting((m) => m ? ({ ...m, [key]: value }) : null);

  const updateAgendaItem = (i: number, val: string) =>
    setMeeting((m) => { 
      if (!m) return null;
      const a = [...m.agenda]; a[i] = val; return { ...m, agenda: a }; 
    });
  const addAgendaItem = () => setMeeting((m) => m ? ({ ...m, agenda: [...m.agenda, ''] }) : null);
  const removeAgendaItem = (i: number) =>
    setMeeting((m) => m ? ({ ...m, agenda: m.agenda.filter((_, idx) => idx !== i) }) : null);

  const updateAttendee = (_id: string, field: keyof Attendee, val: string) =>
    setMeeting((m) => m ? ({
      ...m,
      attendees: m.attendees.map((a) => (a._id === _id ? { ...a, [field]: val } : a)),
    }) : null);
  const addAttendee = () =>
    setMeeting((m) => m ? ({
      ...m,
      attendees: [...m.attendees, { _id: Date.now().toString(), name: '', email: '', status: 'pending' } as any],
    }) : null);
  const removeAttendee = (_id: string) =>
    setMeeting((m) => m ? ({ ...m, attendees: m.attendees.filter((a) => a._id !== _id) }) : null);

  const updateTask = (_id: string, field: keyof Task, val: string) =>
    setMeeting((m) => m ? ({
      ...m,
      tasks: m.tasks.map((t) => (t._id === _id ? { ...t, [field]: val } : t)),
    }) : null);
  const addTask = () =>
    setMeeting((m) => m ? ({
      ...m,
      tasks: [...m.tasks, { _id: Date.now().toString(), title: '', assignedTo: '', dueDate: '', status: 'pending', priority: 'medium' } as any],
    }) : null);
  const removeTask = (_id: string) =>
    setMeeting((m) => m ? ({ ...m, tasks: m.tasks.filter((t) => t._id !== _id) }) : null);

  const updateNote = (_id: string, val: string) =>
    setMeeting((m) => m ? ({
      ...m,
      notes: m.notes.map((n) => (n._id === _id ? { ...n, content: val } : n)),
    }) : null);
  const addNote = () =>
    setMeeting((m) => m ? ({
      ...m,
      notes: [...m.notes, { _id: Date.now().toString(), author: m.organizer.name, content: '', timestamp: new Date().toISOString() } as any],
    }) : null);
  const removeNote = (_id: string) =>
    setMeeting((m) => m ? ({ ...m, notes: m.notes.filter((n) => n._id !== _id) }) : null);

  const handleSave = async () => {
    if (!meeting) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/meetings/${meeting._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meeting),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert(json.message || 'Save failed');
      }
    } catch (err) {
      alert('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading meeting data...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Meeting not found'}</p>
          <button onClick={() => router.back()} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const acceptedCount = meeting.attendees.filter((a) => a.status === 'accepted').length;
  const declinedCount = meeting.attendees.filter((a) => a.status === 'declined').length;
  const pendingCount = meeting.attendees.filter((a) => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top action bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
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
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <X size={14} /> Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-70`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
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
          <p className="text-gray-500 text-sm mt-1 italic">Update the meeting details and press &quot;Save Changes&quot; to persist.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT / main content ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Meeting Type */}
            <SectionCard title="Meeting Type">
              <div className="flex p-1 bg-gray-100 rounded-xl">
                {[
                  { id: 'offline' as const, label: 'Offline', icon: MapPin },
                  { id: 'online' as const, label: 'Online', icon: LinkIcon },
                  { id: 'hybrid' as const, label: 'Hybrid', icon: Users },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateField('meetingType', t.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      meeting.meetingType === t.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <t.icon size={16} />
                    {t.label}
                  </button>
                ))}
              </div>
            </SectionCard>

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
                {(meeting.meetingType === 'offline' || meeting.meetingType === 'hybrid') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className={labelCls}>
                        <span className="flex items-center gap-1"><MapPin size={11} /> Location <span className="text-red-400">*</span></span>
                      </label>
                      <input className={inputCls} value={meeting.location}
                        onChange={(e) => updateField('location', e.target.value)} placeholder="Conference Room" />
                    </div>
                    <div>
                      <label className={labelCls}>
                        <span className="flex items-center gap-1"><Building size={11} /> Floor</span>
                      </label>
                      <input className={inputCls} value={meeting.building}
                        onChange={(e) => updateField('building', e.target.value)} placeholder="Main Office - Floor" />
                    </div>
                  </div>
                )}

                {/* Meeting Link */}
                {(meeting.meetingType === 'online' || meeting.meetingType === 'hybrid') && (
                  <div className="pt-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className={labelCls}>
                      <span className="flex items-center gap-1"><LinkIcon size={11} /> Meeting Link <span className="text-red-400">*</span></span>
                    </label>
                    <input
                      className={inputCls}
                      value={meeting.meetingLink || ''}
                      onChange={(e) => updateField('meetingLink', e.target.value)}
                      placeholder="https://zoom.us/j/..."
                    />
                    <p className="text-[10px] text-gray-400 mt-1 italic">Providing a link will enable a &quot;Join Meeting&quot; button for attendees.</p>
                  </div>
                )}

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
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addAgendaItem}
                  className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-bold transition-colors"
                >
                  <Plus size={15} /> Add Agenda Item
                </button>
              </div>
            </SectionCard>

            {/* Tasks */}
            <SectionCard title="Related Tasks">
              <div className="flex flex-col gap-3">
                {meeting.tasks.map((task) => (
                  <div key={task._id} className="group bg-gray-50/50 border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getTaskStatusColor(task.status)}`}>
                          {task.status.replace('-', ' ')}
                        </span>
                      </div>
                      <button
                        onClick={() => removeTask(task._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className={labelCls}>Task Title</label>
                        <input className={inputCls} value={task.title}
                          onChange={(e) => updateTask(task._id, 'title', e.target.value)} placeholder="Task title" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="col-span-2 sm:col-span-1">
                          <label className={labelCls}>Assigned To</label>
                          <input className={inputCls} value={task.assignedTo}
                            onChange={(e) => updateTask(task._id, 'assignedTo', e.target.value)} placeholder="Name" />
                        </div>
                        <div>
                          <label className={labelCls}>Due Date</label>
                          <input type="date" className={inputCls} value={task.dueDate}
                            onChange={(e) => updateTask(task._id, 'dueDate', e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>Status</label>
                          <div className="relative">
                            <select className={`${inputCls} appearance-none pr-7`} value={task.status}
                              onChange={(e) => updateTask(task._id, 'status', e.target.value)}>
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
                              onChange={(e) => updateTask(task._id, 'priority', e.target.value)}>
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
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-bold transition-colors"
                >
                  <Plus size={15} /> Add Task
                </button>
              </div>
            </SectionCard>

            {/* Notes */}
            <SectionCard title="Meeting Notes">
              <div className="flex flex-col gap-3">
                {meeting.notes.map((note) => (
                  <div key={note._id} className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 ring-2 ring-white">
                          {note.author ? note.author.split(' ').map((n) => n[0]).join('') : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{note.author || 'Anonymous'}</p>
                          <p className="text-[10px] text-gray-400 italic">{new Date(note.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeNote(note._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      className={`${inputCls} resize-none italic font-medium`}
                      rows={3}
                      value={note.content}
                      onChange={(e) => updateNote(note._id, e.target.value)}
                      placeholder="Enter note content..."
                    />
                  </div>
                ))}
                <button
                  onClick={addNote}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-bold transition-colors"
                >
                  <Plus size={15} /> Add Note
                </button>
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT column ── */}
          <div className="flex flex-col gap-6">

            {/* Attendees */}
            <SectionCard title={`Attendee Statistics`}>
              {/* Status summary - Professional Sticker Style */}
              <div className="flex flex-col gap-3 mb-2">
                <div className="flex items-center justify-between p-3.5 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 shadow-sm transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-emerald-200 shadow-lg group-hover:scale-110 transition-transform">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Accepted</p>
                      <p className="text-xl font-black text-gray-900 leading-none mt-1">{acceptedCount}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600/50 bg-emerald-100/50 px-2 py-1 rounded-lg">
                    {Math.round((acceptedCount / (meeting.attendees.length || 1)) * 100)}%
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-100 shadow-sm transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-amber-200 shadow-lg group-hover:scale-110 transition-transform">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pending</p>
                      <p className="text-xl font-black text-gray-900 leading-none mt-1">{pendingCount}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-amber-600/50 bg-amber-100/50 px-2 py-1 rounded-lg">
                    {Math.round((pendingCount / (meeting.attendees.length || 1)) * 100)}%
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border border-rose-100 shadow-sm transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-rose-200 shadow-lg group-hover:scale-110 transition-transform">
                      <XCircle size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Declined</p>
                      <p className="text-xl font-black text-gray-900 leading-none mt-1">{declinedCount}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-rose-600/50 bg-rose-100/50 px-2 py-1 rounded-lg">
                    {Math.round((declinedCount / (meeting.attendees.length || 1)) * 100)}%
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title={`Attendee List (${meeting.attendees.length})`}>

              <div className="flex flex-col gap-3">
                {meeting.attendees.map((attendee) => (
                  <div key={attendee._id} className="group border border-gray-100 rounded-xl p-3 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0 ring-2 ring-white shadow-sm">
                          {attendee.name ? attendee.name.split(' ').map((n) => n[0]).join('') : '?'}
                        </div>
                        {attendee.status === 'accepted' && <CheckCircle size={14} className="text-green-500" />}
                        {attendee.status === 'declined' && <XCircle size={14} className="text-red-500" />}
                        {attendee.status === 'pending' && <Clock size={14} className="text-gray-400" />}
                      </div>
                      <button
                        onClick={() => removeAttendee(attendee._id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <input
                        className={inputCls}
                        value={attendee.name}
                        onChange={(e) => updateAttendee(attendee._id, 'name', e.target.value)}
                        placeholder="Full name"
                      />
                      <input
                        type="email"
                        className={inputCls}
                        value={attendee.email}
                        onChange={(e) => updateAttendee(attendee._id, 'email', e.target.value)}
                        placeholder="Email address"
                      />
                      <div className="flex bg-gray-100 p-0.5 rounded-xl h-8">
                        {[
                          { id: 'pending' as const, icon: Clock, active: 'bg-white text-amber-600 shadow-sm' },
                          { id: 'accepted' as const, icon: CheckCircle, active: 'bg-white text-emerald-600 shadow-sm' },
                          { id: 'declined' as const, icon: XCircle, active: 'bg-white text-rose-600 shadow-sm' },
                        ].map((s) => {
                          const isSelected = attendee.status === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                // Manual update logic for better UX
                                updateAttendee(attendee._id, 'status', s.id);
                              }}
                              className={`flex-1 flex items-center justify-center gap-1 rounded-lg text-[9px] font-black transition-all ${
                                isSelected ? s.active : `text-gray-400 hover:text-gray-600`
                              }`}
                            >
                              <s.icon size={11} className={isSelected ? '' : 'opacity-40'} />
                              <span className="uppercase tracking-tighter">{s.id}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addAttendee}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-bold transition-colors mt-2"
                >
                  <Plus size={15} /> Add Attendee
                </button>
              </div>
            </SectionCard>

            {/* Meeting Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Live Statistics</h3>
              {[
                { label: 'Total Attendees', val: meeting.attendees.length },
                { label: 'Tasks Assigned', val: meeting.tasks.length },
                { label: 'Agenda Items', val: meeting.agenda.length },
                { label: 'Notes Added', val: meeting.notes.length },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-bold text-gray-500 italic lowercase">{label}</span>
                  <span className="text-sm font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{val}</span>
                </div>
              ))}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-4 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl transform active:scale-95 flex items-center justify-center gap-2 ${
                saved ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle size={18} /> : <Save size={18} />}
              {saved ? '✓ Changes Saved Successfully' : saving ? 'Syncing with Server...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Professional Toast Notification */}
      {saved && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl p-5 shadow-2xl flex items-center gap-5 min-w-[320px] ring-1 ring-emerald-50">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
              <CheckCircle size={24} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-gray-900">Changes Saved!</p>
              <p className="text-xs text-emerald-600 font-medium tracking-tight">Meeting details updated successfully</p>
            </div>
            <button
              onClick={() => setSaved(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}