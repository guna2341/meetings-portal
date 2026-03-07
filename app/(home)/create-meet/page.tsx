'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Calendar, Clock, MapPin, Building, Users,
  Plus, Trash2, ChevronDown, GripVertical, Save,
  CheckCircle, User, FileText, ListTodo, StickyNote, X,
  Loader2, AlertCircle, Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createMeeting } from '@/src/services/meetings';

// ─── Interfaces ────────────────────────────────────────────────────────────

interface ApiUser {
  _id: string;
  name: string;
  email: string;
}

interface Attendee {
  id: number;
  name: string;
  email: string;
}

interface Task {
  id: number;
  title: string;
  assignedTo: string;       // stores user _id
  assignedToName: string;   // stores display name (UI only, not sent to API)
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface MeetingForm {
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
  agenda: string[];
  tasks: Task[];
  notes: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const inputCls =
  'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

const steps = [
  { id: 1, label: 'Details', icon: FileText },
  { id: 2, label: 'Agenda', icon: ListTodo },
  { id: 3, label: 'Attendees', icon: Users },
  { id: 4, label: 'Tasks & Notes', icon: StickyNote },
];

const priorityConfig = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-yellow-50 text-yellow-700',
  low: 'bg-green-50 text-green-700',
};

const defaultForm: MeetingForm = {
  title: '',
  description: '',
  date: '',
  time: '',
  duration: '60 min',
  location: '',
  building: '',
  status: 'upcoming',
  organizer: { name: '', email: '' },
  attendees: [],
  agenda: [''],
  tasks: [],
  notes: '',
};

// ─── useAllUsers ──────────────────────────────────────────────────────────

function useAllUsers() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/users?limit=50');
        const json = await res.json();
        if (json.success) setUsers(json.data);
      } catch { /* silently ignore */ }
      finally { setLoading(false); }
    };
    run();
  }, []);

  return { users, loading };
}

// ─── useUsers — debounced ─────────────────────────────────────────────────

function useUsers(search: string) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams({ limit: '20' });
        if (search.trim()) q.set('search', search.trim());
        const res = await fetch(`/api/users?${q}`);
        const json = await res.json();
        if (!cancelled && json.success) setUsers(json.data);
      } catch { /* silently ignore */ }
      finally { if (!cancelled) setLoading(false); }
    };
    const timer = setTimeout(run, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search]);

  return { users, loading };
}

// ─── SectionCard ───────────────────────────────────────────────────────────

function SectionCard({
  title, subtitle, children,
}: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── OrganizerSelect ───────────────────────────────────────────────────────

function OrganizerSelect({
  value,
  onChange,
}: {
  value: MeetingForm['organizer'];
  onChange: (v: MeetingForm['organizer']) => void;
}) {
  const [query, setQuery] = useState(value.name);
  const [nameOpen, setNameOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const { users, loading } = useAllUsers();
  const nameRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLDivElement>(null);

  const isSelected = !!value.name && !!value.email;

  const nameFiltered = users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));
  const emailFiltered = users.filter((u) => u.email.toLowerCase().includes(value.email.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (nameRef.current && !nameRef.current.contains(e.target as Node)) setNameOpen(false);
      if (emailRef.current && !emailRef.current.contains(e.target as Node)) setEmailOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClear = () => { setQuery(''); onChange({ name: '', email: '' }); };

  const UserOption = ({ user, onPick }: { user: ApiUser; onPick: () => void }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onPick(); }}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
    >
      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
        {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{user.name}</p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>
    </button>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div ref={nameRef} className="relative">
        <label className={labelCls}>Name</label>
        <div className="relative">
          <input
            className={`${inputCls} pr-8 ${isSelected ? 'bg-gray-50 text-gray-500' : ''}`}
            value={query}
            readOnly={isSelected}
            onChange={(e) => { if (isSelected) return; setQuery(e.target.value); onChange({ ...value, name: e.target.value }); setNameOpen(true); }}
            onFocus={() => { if (!isSelected) setNameOpen(true); }}
            placeholder="Your name"
          />
          {isSelected ? (
            <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
              <X size={13} />
            </button>
          ) : loading ? (
            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
          ) : null}
        </div>
        {nameOpen && !isSelected && nameFiltered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
              {nameFiltered.map((user) => (
                <li key={user._id}>
                  <UserOption user={user} onPick={() => { setQuery(user.name); onChange({ name: user.name, email: user.email }); setNameOpen(false); }} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div ref={emailRef} className="relative">
        <label className={labelCls}>Email</label>
        <div className="relative">
          <input
            type="email"
            className={`${inputCls} pr-8 ${isSelected ? 'bg-gray-50 text-gray-500 cursor-default' : ''}`}
            value={value.email}
            readOnly={isSelected}
            onChange={(e) => { if (isSelected) return; onChange({ ...value, email: e.target.value }); setEmailOpen(true); }}
            onFocus={() => { if (!isSelected) setEmailOpen(true); }}
            placeholder={isSelected ? '' : 'Auto-filled when you pick a user'}
          />
          {isSelected ? (
            <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
              <X size={13} />
            </button>
          ) : loading ? (
            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
          ) : null}
        </div>
        {emailOpen && !isSelected && emailFiltered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
              {emailFiltered.map((user) => (
                <li key={user._id}>
                  <UserOption user={user} onPick={() => { setQuery(user.name); onChange({ name: user.name, email: user.email }); setEmailOpen(false); }} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── UserSearchDropdown ────────────────────────────────────────────────────

function UserSearchDropdown({
  onSelect,
  excluded,
}: {
  onSelect: (user: ApiUser) => void;
  excluded: string[];
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { users, loading } = useUsers(query);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = users.filter((u) => !excluded.includes(u.email));

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={`${inputCls} pl-9`}
          placeholder="Search users by name or email…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {loading && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {filtered.length === 0 && !loading ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              {query ? 'No users found' : 'Start typing to search users'}
            </div>
          ) : (
            <ul className="max-h-52 overflow-y-auto divide-y divide-gray-50">
              {filtered.map((user) => (
                <li key={user._id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); onSelect(user); setQuery(''); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
                      {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── UserCombobox ─────────────────────────────────────────────────────────
// Now stores the user's _id in value, but displays their name in the input.

function UserCombobox({
  value,          // the user _id currently selected
  displayName,    // the human-readable name to show in the input
  onChange,       // called with (userId, userName) when a user is picked
  onClear,        // called when the field is cleared
}: {
  value: string;
  displayName: string;
  onChange: (userId: string, userName: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState(displayName);
  const [open, setOpen] = useState(false);
  const { users, loading } = useUsers(query);
  const ref = useRef<HTMLDivElement>(null);
  const isSelected = !!value;

  // Keep input in sync if parent resets
  useEffect(() => { setQuery(displayName); }, [displayName]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          className={`${inputCls} pr-7 ${isSelected ? 'bg-gray-50 text-gray-600' : ''}`}
          value={query}
          readOnly={isSelected}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (!isSelected) setOpen(true); }}
          placeholder="Search user…"
        />
        {isSelected ? (
          <button
            type="button"
            onClick={() => { onClear(); setQuery(''); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={12} />
          </button>
        ) : loading ? (
          <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        ) : null}
      </div>

      {open && !isSelected && users.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <ul className="max-h-40 overflow-y-auto divide-y divide-gray-50">
            {users.map((user) => (
              <li key={user._id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(user._id, user.name);   // ← pass ID, not name
                    setQuery(user.name);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
                    {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function CreateMeetingPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<MeetingForm>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // ── Lock organizer to the logged-in user from localStorage ────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('data');
      if (!raw) return;
      const user: { id: string; name: string; email: string } = JSON.parse(raw);
      if (user?.name && user?.email) {
        setForm((f) => ({ ...f, organizer: { name: user.name, email: user.email } }));
      }
    } catch {
    }
  }, [currentStep]);

  // ── Field helpers ──────────────────────────────────────────────────────

  const updateField = <K extends keyof MeetingForm>(key: K, value: MeetingForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateAgendaItem = (i: number, val: string) =>
    setForm((f) => { const a = [...f.agenda]; a[i] = val; return { ...f, agenda: a }; });
  const addAgendaItem = () => setForm((f) => ({ ...f, agenda: [...f.agenda, ''] }));
  const removeAgendaItem = (i: number) =>
    setForm((f) => ({ ...f, agenda: f.agenda.filter((_, idx) => idx !== i) }));

  const addAttendeeFromUser = (user: ApiUser) =>
    setForm((f) => ({
      ...f,
      attendees: [...f.attendees, { id: Date.now(), name: user.name, email: user.email }],
    }));
  const removeAttendee = (id: number) =>
    setForm((f) => ({ ...f, attendees: f.attendees.filter((a) => a.id !== id) }));

  const addTask = () =>
    setForm((f) => ({
      ...f,
      tasks: [
        ...f.tasks,
        { id: Date.now(), title: '', assignedTo: '', assignedToName: '', dueDate: '', priority: 'medium' },
      ],
    }));

  // Update a task's plain fields
  const updateTask = (id: number, field: keyof Omit<Task, 'id' | 'assignedTo' | 'assignedToName'>, val: string) =>
    setForm((f) => ({ ...f, tasks: f.tasks.map((t) => t.id === id ? { ...t, [field]: val } : t) }));

  // Update assignedTo (ID) + assignedToName together
  const updateTaskAssignee = (id: number, userId: string, userName: string) =>
    setForm((f) => ({
      ...f,
      tasks: f.tasks.map((t) =>
        t.id === id ? { ...t, assignedTo: userId, assignedToName: userName } : t
      ),
    }));

  const clearTaskAssignee = (id: number) =>
    setForm((f) => ({
      ...f,
      tasks: f.tasks.map((t) =>
        t.id === id ? { ...t, assignedTo: '', assignedToName: '' } : t
      ),
    }));

  const removeTask = (id: number) =>
    setForm((f) => ({ ...f, tasks: f.tasks.filter((t) => t.id !== id) }));

  // ── Validation ─────────────────────────────────────────────────────────

  const stepValid = (step: number) => {
    if (step === 1) return form.title.trim() !== '' && form.date !== '' && form.time.trim() !== '';
    if (step === 2) return form.agenda.some((a) => a.trim() !== '');
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createMeeting({
        title: form.title,
        description: form.description || undefined,
        date: form.date,
        time: form.time,
        duration: form.duration,
        location: form.location || undefined,
        building: form.building || undefined,
        status: form.status,
        organizer: form.organizer,
        attendees: form.attendees.map(({ name, email }) => ({ name, email, status: 'pending' as const })),
        agenda: form.agenda.filter((a) => a.trim() !== ''),
        tasks: form.tasks
          .filter((t) => t.title.trim() !== '' && t.assignedTo !== '')
          .map(({ title, assignedTo, dueDate, priority }) => ({
            title,
            assignedTo,   // ← this is now a user _id string
            dueDate,
            priority,
            status: 'pending' as const,
          })),
        notes: form.notes.trim()
          ? [{ author: form.organizer.name || 'Organizer', content: form.notes }]
          : [],
      });

      if (result.success) {
        setCreatedId((result.data as { _id: any })._id);
      } else {
        setSubmitError(result.message ?? 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setSubmitError('Network error — please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────

  if (createdId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Meeting Created!</h2>
          <p className="text-gray-500 text-sm mb-1">
            <span className="font-semibold text-gray-700">{form.title}</span> has been scheduled.
          </p>
          <p className="text-gray-400 text-xs mb-8">
            {new Date(form.date).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}{' '}· {form.time}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              `${form.agenda.filter((a) => a.trim()).length} agenda items`,
              `${form.attendees.length} attendees`,
              `${form.tasks.length} tasks`,
            ].map((label) => (
              <span key={label} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                {label}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(`/meetings/${createdId}`)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              View Meeting
            </button>
            <button
              onClick={() => { setCreatedId(null); setCurrentStep(1); setForm(defaultForm); }}
              className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
          )}
          {currentStep < steps.length ? (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!stepValid(currentStep)}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Save size={14} /> Create Meeting</>}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Meeting</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details to schedule a new meeting.</p>
        </div>

        {/* Step indicator */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex items-center">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isDone = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => isDone && setCurrentStep(step.id)}
                    className={`flex items-center gap-2 ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${isDone ? 'bg-green-100 text-green-600' :
                        isActive ? 'bg-blue-600 text-white shadow-md' :
                          'bg-gray-100 text-gray-400'
                      }`}>
                      {isDone ? <CheckCircle size={16} /> : <Icon size={14} />}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block transition-colors ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'
                      }`}>
                      {step.label}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-3 transition-colors ${isDone ? 'bg-green-200' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step 1: Details ── */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-5">
            <SectionCard title="Meeting Details" subtitle="Basic information about the meeting">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelCls}>Meeting Title <span className="text-red-400">*</span></label>
                  <input
                    className={inputCls}
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g. Q2 Planning Review"
                  />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={3}
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="What is this meeting about?"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>
                      <span className="flex items-center gap-1"><Calendar size={11} /> Date <span className="text-red-400">*</span></span>
                    </label>
                    <input type="date" className={inputCls} value={form.date}
                      onChange={(e) => updateField('date', e.target.value)} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>
                      <span className="flex items-center gap-1"><Clock size={11} /> Time <span className="text-red-400">*</span></span>
                    </label>
                    <div className="flex items-center gap-1">
                      <div className="relative flex-1">
                        <select
                          className={`${inputCls} appearance-none pr-7`}
                          value={form.time.split(' ')[0] || ''}
                          onChange={(e) => {
                            const part = form.time.split(' ')[1] || 'AM';
                            updateField('time', `${e.target.value} ${part}`);
                          }}
                        >
                          <option value="" disabled>Time</option>
                          {['12:00', '12:30', '1:00', '1:30', '2:00', '2:30', '3:00', '3:30', '4:00', '4:30', '5:00', '5:30', '6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30'].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0">
                        {['AM', 'PM'].map((p) => {
                          const isActive = (form.time.split(' ')[1] || 'AM') === p;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                const timeVal = form.time.split(' ')[0] || '12:00';
                                updateField('time', `${timeVal} ${p}`);
                              }}
                              className={`px-2 py-2 text-[10px] font-bold transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'
                                }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Duration</label>
                    <div className="relative">
                      <select className={`${inputCls} appearance-none pr-8`} value={form.duration}
                        onChange={(e) => updateField('duration', e.target.value)}>
                        {['15 min', '30 min', '45 min', '60 min', '90 min', '120 min'].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <div className="relative">
                      <select className={`${inputCls} appearance-none pr-8`} value={form.status}
                        onChange={(e) => updateField('status', e.target.value as MeetingForm['status'])}>
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}><span className="flex items-center gap-1"><MapPin size={11} /> Location</span></label>
                    <input className={inputCls} value={form.location}
                      onChange={(e) => updateField('location', e.target.value)} placeholder="Conference Room A" />
                  </div>
                  <div>
                    <label className={labelCls}><span className="flex items-center gap-1"><Building size={11} /> Building</span></label>
                    <input className={inputCls} value={form.building}
                      onChange={(e) => updateField('building', e.target.value)} placeholder="Main Office - 3rd Floor" />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Organizer" subtitle="Automatically set to you as the meeting creator">
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                  {form.organizer.name
                    ? form.organizer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : <User size={15} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {form.organizer.name || "Loading…"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{form.organizer.email}</p>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                  Organizer
                </span>
              </div>
            </SectionCard>

            {!stepValid(1) && (
              <p className="text-xs text-red-400 px-1">* Title, date, and time are required to continue.</p>
            )}
          </div>
        )}

        {/* ── Step 2: Agenda ── */}
        {currentStep === 2 && (
          <SectionCard title="Meeting Agenda" subtitle="Add the topics to be covered in this meeting">
            <div className="flex flex-col gap-2">
              {form.agenda.map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <GripVertical size={14} className="text-gray-300 shrink-0" />
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 shrink-0">
                    {i + 1}
                  </div>
                  <input
                    className={`${inputCls} flex-1`}
                    value={item}
                    onChange={(e) => updateAgendaItem(i, e.target.value)}
                    placeholder={`Agenda item ${i + 1}`}
                    autoFocus={i === form.agenda.length - 1 && i > 0}
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
        )}

        {/* ── Step 3: Attendees ── */}
        {currentStep === 3 && (
          <SectionCard
            title={`Attendees${form.attendees.length > 0 ? ` (${form.attendees.length})` : ''}`}
            subtitle="Search and select users from your organisation"
          >
            <div className="flex flex-col gap-4">
              <UserSearchDropdown
                onSelect={addAttendeeFromUser}
                excluded={form.attendees.map((a) => a.email)}
              />
              {form.attendees.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users size={18} className="text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-400">No attendees added yet. Search above to add people.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {form.attendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0">
                        {attendee.name
                          ? attendee.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                          : <User size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{attendee.name}</p>
                        <p className="text-xs text-gray-400 truncate">{attendee.email}</p>
                      </div>
                      <button
                        onClick={() => removeAttendee(attendee.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── Step 4: Tasks & Notes ── */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-5">
            <SectionCard title="Pre-Meeting Tasks" subtitle="Assign tasks to be completed before the meeting">
              {form.tasks.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ListTodo size={20} className="text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-4">No tasks assigned yet</p>
                  <button
                    onClick={addTask}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors mx-auto"
                  >
                    <Plus size={15} /> Add First Task
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {form.tasks.map((task) => (
                    <div key={task.id} className="group bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[task.priority]}`}>
                          {task.priority} priority
                        </span>
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
                          <input
                            className={inputCls}
                            value={task.title}
                            onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                            placeholder="e.g. Prepare slide deck"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className={labelCls}>Assigned To</label>
                            {/* Now stores _id, shows name */}
                            <UserCombobox
                              value={task.assignedTo}
                              displayName={task.assignedToName}
                              onChange={(userId, userName) => updateTaskAssignee(task.id, userId, userName)}
                              onClear={() => clearTaskAssignee(task.id)}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Due Date</label>
                            <input
                              type="date"
                              className={inputCls}
                              value={task.dueDate}
                              onChange={(e) => updateTask(task.id, 'dueDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Priority</label>
                            <div className="relative">
                              <select
                                className={`${inputCls} appearance-none pr-7`}
                                value={task.priority}
                                onChange={(e) => updateTask(task.id, 'priority', e.target.value as Task['priority'])}
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Show selected user's ID in a subtle hint for debugging (optional — remove in prod) */}
                      {task.assignedTo && (
                        <p className="text-xs text-gray-300 mt-1.5 font-mono truncate">id: {task.assignedTo}</p>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addTask}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    <Plus size={15} /> Add Task
                  </button>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Meeting Notes" subtitle="Add any pre-meeting notes or context for attendees">
              <textarea
                className={`${inputCls} resize-none`}
                rows={5}
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="e.g. Please review the attached budget document before joining."
              />
            </SectionCard>

            {/* Review summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-xs font-bold tracking-widest uppercase text-blue-400 mb-3">Review Summary</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Title', value: form.title || '—' },
                  { label: 'Date & Time', value: form.date ? `${new Date(form.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${form.time}` : '—' },
                  { label: 'Agenda Items', value: form.agenda.filter((a) => a.trim()).length },
                  { label: 'Attendees', value: form.attendees.length },
                  { label: 'Tasks', value: form.tasks.length },
                  { label: 'Location', value: form.location || '—' },
                  { label: 'Duration', value: form.duration },
                  { label: 'Status', value: form.status },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-blue-400">{label}</p>
                    <p className="text-sm font-semibold text-blue-800 truncate">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Failed to create meeting</p>
                  <p className="text-xs text-red-600 mt-0.5">{submitError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => currentStep > 1 ? setCurrentStep((s) => s - 1) : router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            <ArrowLeft size={15} />
            {currentStep > 1 ? 'Previous' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${s.id === currentStep ? 'w-6 bg-blue-600' :
                    s.id < currentStep ? 'w-3 bg-green-400' : 'w-3 bg-gray-200'
                  }`}
              />
            ))}
          </div>

          {currentStep < steps.length ? (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!stepValid(currentStep)}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next Step →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Save size={14} /> Create Meeting</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}