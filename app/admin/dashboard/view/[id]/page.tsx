'use client';

import { Calendar, Clock, Users, MapPin, Building, ArrowLeft, CheckCircle, XCircle, User } from 'lucide-react';
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
  organizer: {
    name: string;
    email: string;
  };
  attendees: Attendee[];
  tasks: Task[];
  notes: Note[];
  agenda: string[];
}

export default function MeetingViewPage() {
  const router = useRouter();

  // Sample meeting data - in real app, this would come from props or API based on meeting ID
  const meeting: MeetingDetails = {
    id: 1,
    title: 'Q1 Planning Review',
    description: 'Quarterly planning and goal setting session for Q1 2026. We will discuss budget allocation, team objectives, key performance indicators, and strategic initiatives for the upcoming quarter.',
    date: '2026-02-20',
    time: '10:00 AM',
    duration: '60 min',
    location: 'Conference Room A',
    building: 'Main Office - 3rd Floor',
    status: 'upcoming',
    organizer: {
      name: 'John Doe',
      email: 'john.doe@company.com'
    },
    attendees: [
      { id: 1, name: 'Sarah Johnson', email: 'sarah.j@company.com', status: 'accepted' },
      { id: 2, name: 'Michael Chen', email: 'michael.c@company.com', status: 'accepted' },
      { id: 3, name: 'Emma Davis', email: 'emma.d@company.com', status: 'pending' },
      { id: 4, name: 'Alex Kumar', email: 'alex.k@company.com', status: 'accepted' },
      { id: 5, name: 'Lisa Wong', email: 'lisa.w@company.com', status: 'declined' },
    ],
    tasks: [
      {
        id: 1,
        title: 'Prepare Q1 Budget Report',
        assignedTo: 'Sarah Johnson',
        dueDate: '2026-02-19',
        status: 'in-progress',
        priority: 'high'
      },
      {
        id: 2,
        title: 'Compile Team KPIs',
        assignedTo: 'Michael Chen',
        dueDate: '2026-02-19',
        status: 'completed',
        priority: 'high'
      },
      {
        id: 3,
        title: 'Review Strategic Initiatives',
        assignedTo: 'Emma Davis',
        dueDate: '2026-02-20',
        status: 'pending',
        priority: 'medium'
      }
    ],
    notes: [
      {
        id: 1,
        author: 'John Doe',
        content: 'Please review the budget proposals before the meeting. Focus on departments with over 20% variance.',
        timestamp: '2026-02-15 2:30 PM'
      },
      {
        id: 2,
        author: 'Sarah Johnson',
        content: 'Budget report draft is ready for review. Shared in the drive folder.',
        timestamp: '2026-02-16 10:15 AM'
      }
    ],
    agenda: [
      'Opening remarks and objectives',
      'Q4 performance review',
      'Q1 budget allocation discussion',
      'Team goals and KPIs setting',
      'Strategic initiatives presentation',
      'Q&A and open discussion',
      'Action items and next steps'
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAttendeeStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700';
      case 'pending':
        return 'bg-gray-50 text-gray-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700';
      case 'low':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const acceptedCount = meeting.attendees.filter(a => a.status === 'accepted').length;
  const declinedCount = meeting.attendees.filter(a => a.status === 'declined').length;
  const pendingCount = meeting.attendees.filter(a => a.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto py-10">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back to Meetings</span>
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(meeting.status)}`}>
                {meeting.status}
              </span>
            </div>
            <p className="text-gray-600 mt-2">{meeting.description}</p>
          </div>
        </div>

        {/* Meeting Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(meeting.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Time & Duration</p>
              <p className="text-sm font-semibold text-gray-900">{meeting.time}</p>
              <p className="text-xs text-gray-600">{meeting.duration}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Location</p>
              <p className="text-sm font-semibold text-gray-900">{meeting.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Building className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Building</p>
              <p className="text-sm font-semibold text-gray-900">{meeting.building}</p>
            </div>
          </div>
        </div>

        {/* Organizer */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Organized by</p>
              <p className="text-sm font-semibold text-gray-900">{meeting.organizer.name}</p>
              <p className="text-xs text-gray-600">{meeting.organizer.email}</p>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agenda */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              Meeting Agenda
            </h2>
            <ol className="space-y-3">
              {meeting.agenda.map((item, index) => (
                <li key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 pt-1">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              Related Tasks
            </h2>
            <div className="space-y-3">
              {meeting.tasks.map((task) => (
                <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Assigned to:</span> {task.assignedTo}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>Due: {new Date(task.dueDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              Meeting Notes
            </h2>
            <div className="space-y-4">
              {meeting.notes.map((note) => (
                <div key={note.id} className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">
                        {note.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">{note.author}</p>
                        <p className="text-xs text-gray-500">{note.timestamp}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 ml-11">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Attendees */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span>Attendees</span>
              <span className="text-sm font-normal text-gray-600">{meeting.attendees.length} people</span>
            </h2>

            {/* Status Summary */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="p-3 bg-green-50 rounded-lg text-center border border-green-100">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Accepted</p>
                <p className="text-xl font-bold text-green-700">{acceptedCount}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-200">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Pending</p>
                <p className="text-xl font-bold text-gray-700">{pendingCount}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center border border-red-100">
                <div className="flex items-center justify-center mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Declined</p>
                <p className="text-xl font-bold text-red-700">{declinedCount}</p>
              </div>
            </div>

            {/* Attendees List */}
            <div className="space-y-2">
              {meeting.attendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {attendee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{attendee.name}</p>
                    <p className="text-xs text-gray-500 truncate">{attendee.email}</p>
                  </div>
                  {getAttendeeStatusIcon(attendee.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Meeting Statistics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Total Attendees</span>
                <span className="text-lg font-bold text-gray-900">{meeting.attendees.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Tasks Assigned</span>
                <span className="text-lg font-bold text-gray-900">{meeting.tasks.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Agenda Items</span>
                <span className="text-lg font-bold text-gray-900">{meeting.agenda.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Notes Added</span>
                <span className="text-lg font-bold text-gray-900">{meeting.notes.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}