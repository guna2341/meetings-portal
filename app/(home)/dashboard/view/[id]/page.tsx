'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Building, ArrowLeft, CheckCircle, XCircle, User, Loader2, AlertCircle, Link as LinkIcon, Trash2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface Attendee {
  _id: string;
  userId?: string;
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
  organizer: {
    name: string;
    email: string;
    userId?: string;
  };
  attendees: Attendee[];
  tasks: Task[];
  notes: Note[];
  agenda: string[];
}

export default function MeetingViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [isUpdatingRSVP, setIsUpdatingRSVP] = useState(false);
  const [showOverlapWarning, setShowOverlapWarning] = useState(false);
  const [overlapConflicts, setOverlapConflicts] = useState<any[]>([]);
  const [pendingRSVPStatus, setPendingRSVPStatus] = useState<'accepted' | 'declined' | null>(null);
  const [isCheckingOverlap, setIsCheckingOverlap] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('data');
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const fetchMeeting = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/meetings/${id}`);
      const json = await res.json();
      if (json.success) {
        setMeeting(json.data);
      } else {
        setError(json.message || 'Failed to load meeting details');
      }
    } catch (err) {
      setError('Network error - please check your connection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchMeeting();
  }, [id]);

  const handleRSVP = async (status: 'accepted' | 'declined', force: boolean = false) => {
    if (!meeting || !currentUser || isUpdatingRSVP) return;

    // 1. Check for overlaps if status is 'accepted' and not forced
    if (status === 'accepted' && !force) {
      try {
        setIsCheckingOverlap(true);
        const res = await fetch(`/api/meetings/overlap?meetingId=${id}`);
        const json = await res.json();
        if (json.success && json.hasOverlap) {
          setOverlapConflicts(json.conflicts);
          setPendingRSVPStatus(status);
          setShowOverlapWarning(true);
          return;
        }
      } catch (err) {
        console.error("Overlap check failed", err);
      } finally {
        setIsCheckingOverlap(false);
      }
    }

    try {
      setIsUpdatingRSVP(true);
      const updatedAttendees = meeting.attendees.map(a => {
        if (a.email === currentUser.email || (a.userId && a.userId === currentUser.id)) {
          return { ...a, status };
        }
        return a;
      });

      const res = await fetch(`/api/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendees: updatedAttendees }),
      });

      const json = await res.json();
      if (json.success) {
        setMeeting(json.data);
        setShowOverlapWarning(false);
        setOverlapConflicts([]);
        setPendingRSVPStatus(null);
      } else {
        alert(json.message || 'Failed to update RSVP');
      }
    } catch (err) {
      alert('Network error - failed to update RSVP');
    } finally {
      setIsUpdatingRSVP(false);
    }
  };

  const handleDeleteMeeting = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/meetings/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (json.success) {
        setShowDeleteModal(false);
        router.push('/dashboard');
      } else {
        alert(json.message || "Failed to delete meeting");
      }
    } catch (err) {
      alert("Network error - failed to delete meeting");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAttendeeStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'declined': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />;
      default: return null;
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

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-[400px] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error || 'Meeting not found'}</p>
          <button 
            onClick={() => router.back()}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const acceptedCount = meeting.attendees.filter(a => a.status === 'accepted').length;
  const declinedCount = meeting.attendees.filter(a => a.status === 'declined').length;
  const pendingCount = meeting.attendees.filter(a => a.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        <span className="font-medium">Back to Dashboard</span>
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                meeting.meetingType === 'online' ? 'bg-blue-600 text-white shadow-sm' :
                meeting.meetingType === 'hybrid' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-600 text-white shadow-sm'
              }`}>
                {meeting.meetingType}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(meeting.status)}`}>
                {meeting.status}
              </span>
            </div>
            <p className="text-gray-600 mt-2 whitespace-pre-wrap">{meeting.description || 'No description provided.'}</p>
          </div>

          {/* RSVP Actions - Only for invited users (attendees) who aren't organizers */}
          {currentUser && meeting.attendees.some(a => a.email === currentUser.email || a.userId === currentUser.id) && (
            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 self-center md:self-start">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Your response</span>
              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => handleRSVP('accepted')}
                  disabled={isUpdatingRSVP || isCheckingOverlap}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    meeting.attendees.find(a => a.email === currentUser.email || a.userId === currentUser.id)?.status === 'accepted'
                      ? 'bg-green-600 text-white shadow-md scale-105'
                      : 'text-gray-500 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  {isCheckingOverlap || (isUpdatingRSVP && pendingRSVPStatus === 'accepted') ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Accept
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button
                  onClick={() => handleRSVP('declined')}
                  disabled={isUpdatingRSVP}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    meeting.attendees.find(a => a.email === currentUser.email || a.userId === currentUser.id)?.status === 'declined'
                      ? 'bg-red-600 text-white shadow-md scale-105'
                      : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <XCircle size={16} />
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Join Meeting Button for Online Meetings */}
          {meeting.meetingLink && (meeting.status === 'upcoming' || meeting.status === 'completed') && (
            <a
              href={meeting.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 shrink-0 self-center md:self-start"
            >
              <LinkIcon size={18} />
              Join Meeting
            </a>
          )}

          {/* Organizer Actions */}
          {currentUser && (meeting.organizer.userId === currentUser.id || meeting.organizer.email === currentUser.email) && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-200 hover:bg-red-100 hover:text-red-700 hover:scale-[1.02] transition-all active:scale-95 shrink-0 self-center md:self-start ml-auto"
            >
              <Trash2 size={18} />
              Delete Meeting
            </button>
          )}
        </div>

        {/* Meeting Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium italic">Date</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {new Date(meeting.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <Clock className="w-5 h-5 text-purple-600" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium italic">Time & Duration</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{meeting.time}</p>
              <p className="text-xs text-gray-600 italic">Duration: {meeting.duration}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <MapPin className="w-5 h-5 text-green-600" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium italic">Location</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {meeting.meetingType === 'online' ? 'Online Meeting' : (meeting.location || 'N/A')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <Building className="w-5 h-5 text-orange-600" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium italic">Building</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {meeting.meetingType === 'online' ? 'Virtual' : (meeting.building || 'N/A')}
              </p>
            </div>
          </div>
        </div>

        {/* Organizer */}
        <div className="mt-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Organized by</p>
              <p className="text-sm font-semibold text-gray-900">{meeting.organizer?.name || 'Unknown'}</p>
              <p className="text-xs text-gray-600">{meeting.organizer?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agenda */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              Meeting Agenda
            </h2>
            {meeting.agenda && meeting.agenda.length > 0 ? (
              <ol className="space-y-3">
                {meeting.agenda.map((item, index) => (
                  <li key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 pt-1.5 font-medium">{item}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-500 italic text-sm">No agenda items added.</p>
            )}
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              Related Tasks
            </h2>
            {meeting.tasks && meeting.tasks.length > 0 ? (
              <div className="space-y-4">
                {meeting.tasks.map((task) => (
                  <div key={task._id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all bg-gray-50/30">
                    <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                      <h3 className="font-bold text-gray-900 flex-1">{task.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getTaskStatusColor(task.status)}`}>
                          {task.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-600">
                        <span className="font-bold text-gray-500 italic lowercase block mb-1">Assigned to</span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {meeting.attendees.find(a => 
                            (a.userId && a.userId === task.assignedTo) || 
                            (a._id && a._id === task.assignedTo)
                          )?.name || task.assignedTo || 'Unassigned'}
                        </span>
                      </p>
                      <div className="text-xs text-gray-600">
                        <span className="font-bold text-gray-500 italic lowercase block mb-1">Due Date</span>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{new Date(task.dueDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">No tasks assigned for this meeting.</p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              Meeting Notes
            </h2>
            {meeting.notes && meeting.notes.length > 0 ? (
              <div className="space-y-4">
                {meeting.notes.map((note) => (
                  <div key={note._id} className="p-4 bg-gradient-to-br from-gray-50/50 to-blue-50/50 rounded-xl border border-gray-100">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500/80 to-purple-500/80 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white font-bold text-[10px]">
                          {note.author ? note.author.split(' ').map(n => n[0]).join('') : '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-bold text-sm text-gray-900 truncate">{note.author || 'Anonymous'}</p>
                          <p className="text-[10px] text-gray-400 italic font-medium shrink-0">
                            {new Date(note.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium pl-11">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">No notes have been added yet.</p>
            )}
          </div>
        </div>

        {/* Right Column - Attendees */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span>Attendees</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">{meeting.attendees?.length || 0} Total</span>
            </h2>

            {/* Status Summary */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="p-3 bg-green-50 rounded-xl text-center border border-green-100/50">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                </div>
                <p className="text-[8px] text-green-600 font-bold uppercase mb-1">Accepted</p>
                <p className="text-xl font-black text-green-700">{acceptedCount}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center border border-gray-200/50">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="w-3.5 h-3.5 text-gray-600" />
                </div>
                <p className="text-[8px] text-gray-600 font-bold uppercase mb-1">Pending</p>
                <p className="text-xl font-black text-gray-700">{pendingCount}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-center border border-red-100/50">
                <div className="flex items-center justify-center mb-1">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                </div>
                <p className="text-[8px] text-red-600 font-bold uppercase mb-1">Declined</p>
                <p className="text-xl font-black text-red-700">{declinedCount}</p>
              </div>
            </div>

            {/* Attendees List */}
            <div className="space-y-2">
              {meeting.attendees && meeting.attendees.map((attendee) => (
                <div key={attendee._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100 group">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm transition-transform group-hover:scale-105">
                    <span className="text-white font-bold text-xs">
                      {attendee.name ? attendee.name.split(' ').map(n => n[0]).join('') : '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{attendee.name}</p>
                    <p className="text-[10px] text-gray-500 truncate italic">{attendee.email}</p>
                  </div>
                  <div className="shrink-0 transition-transform group-hover:scale-110">
                    {getAttendeeStatusIcon(attendee.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Stats */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl border border-blue-100 p-6 text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
              <Users className="w-32 h-32" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white/70 mb-5 relative z-10">Meeting Overview</h3>
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                <span className="text-xs font-bold text-white/80 italic">Total Attendees</span>
                <span className="text-lg font-black">{meeting.attendees?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                <span className="text-xs font-bold text-white/80 italic">Tasks Assigned</span>
                <span className="text-lg font-black">{meeting.tasks?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                <span className="text-xs font-bold text-white/80 italic">Agenda Items</span>
                <span className="text-lg font-black">{meeting.agenda?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                <span className="text-xs font-bold text-white/80 italic">Notes Added</span>
                <span className="text-lg font-black">{meeting.notes?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlap Warning Modal */}
      {showOverlapWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowOverlapWarning(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-orange-50">
                <AlertCircle className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Scheduling Conflict!</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                This meeting overlaps with <span className="font-bold text-orange-600">{overlapConflicts.length}</span> other meeting(s) in your schedule.
              </p>

              <div className="space-y-3 mb-8 text-left">
                {overlapConflicts.map((c, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-gray-500 font-medium">
                        {c.time} ({c.duration})
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleRSVP('accepted', true)}
                  disabled={isUpdatingRSVP}
                  className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 active:scale-95"
                >
                  Accept Anyway
                </button>
                <button
                  onClick={() => setShowOverlapWarning(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="bg-orange-50 py-4 px-8 text-center border-t border-orange-100">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-loose">
                Pro Tip: You can still accept if you plan to attend part of both meetings!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Organizer Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-red-50">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Meeting?</h2>
              <p className="text-gray-600 mb-6 text-sm">
                Are you sure you want to permanently delete this meeting? This action cannot be undone and will remove it from all attendees' schedules.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDeleteMeeting}
                  disabled={isDeleting}
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Delete Meeting"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}