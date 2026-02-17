'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, Plus, Search, Filter, MoreVertical, MapPin, User, ChevronRight, Building } from 'lucide-react';

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  attendees: number;
  status: 'upcoming' | 'completed';
  location: string;
  building: string;
  description: string;
  host?: string;
}

interface UpcomingMeeting {
  title: string;
  time: string;
  location: string;
  type: 'hosted' | 'invited';
}

interface MeetingCardProps {
  meeting: Meeting;
  isHosted: boolean;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'hosted' | 'invited'>('hosted');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data - all meetings are now in-person with locations
  const hostedMeetings: Meeting[] = [
    {
      id: 1,
      title: 'Q1 Planning Review',
      date: '2026-02-20',
      time: '10:00 AM',
      duration: '60 min',
      attendees: 8,
      status: 'upcoming',
      location: 'Conference Room A',
      building: 'Main Office',
      description: 'Quarterly planning and goal setting session'
    },
    {
      id: 2,
      title: 'Product Launch Strategy',
      date: '2026-02-18',
      time: '2:00 PM',
      duration: '90 min',
      attendees: 12,
      status: 'upcoming',
      location: 'Board Room',
      building: 'Executive Wing',
      description: 'Discussion on upcoming product launch timeline'
    },
    {
      id: 3,
      title: 'Team Sync',
      date: '2026-02-17',
      time: '9:00 AM',
      duration: '30 min',
      attendees: 5,
      status: 'completed',
      location: 'Meeting Room 3B',
      building: 'Main Office',
      description: 'Daily standup and progress updates'
    }
  ];

  const invitedMeetings: Meeting[] = [
    {
      id: 4,
      title: 'Design Review Session',
      host: 'Sarah Johnson',
      date: '2026-02-19',
      time: '3:00 PM',
      duration: '45 min',
      attendees: 6,
      status: 'upcoming',
      location: 'Design Studio',
      building: 'Creative Center',
      description: 'Review new UI/UX designs for mobile app'
    },
    {
      id: 5,
      title: 'Budget Discussion',
      host: 'Michael Chen',
      date: '2026-02-21',
      time: '11:00 AM',
      duration: '60 min',
      attendees: 4,
      status: 'upcoming',
      location: 'Finance Office',
      building: 'Tower B, 5th Floor',
      description: 'Q1 budget allocation and resource planning'
    },
    {
      id: 6,
      title: 'Client Presentation',
      host: 'Emma Davis',
      date: '2026-02-22',
      time: '1:00 PM',
      duration: '120 min',
      attendees: 15,
      status: 'upcoming',
      location: 'Grand Conference Hall',
      building: 'Main Office',
      description: 'Present quarterly progress to client stakeholders'
    }
  ];

  const upcomingMeetings: UpcomingMeeting[] = [
    { title: 'Team Standup', time: '9:00 AM', location: 'Meeting Room 3B', type: 'hosted' },
    { title: 'Design Review', time: '3:00 PM', location: 'Design Studio', type: 'invited' },
  ];

  const filteredHostedMeetings = hostedMeetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvitedMeetings = invitedMeetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const MeetingCard = ({ meeting, isHosted }: MeetingCardProps) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              meeting.status === 'upcoming' 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {meeting.status}
            </span>
          </div>
          {!isHosted && meeting.host && (
            <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
              <User className="w-4 h-4" />
              Hosted by {meeting.host}
            </p>
          )}
          <p className="text-sm text-gray-600 mb-3">{meeting.description}</p>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{new Date(meeting.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{meeting.time} ({meeting.duration})</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{meeting.attendees} attendees</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{meeting.location}</span>
        </div>
      </div>

      {meeting.building && (
        <div className="flex items-center gap-2 text-gray-600 mb-4 bg-gray-50 rounded-lg p-3">
          <Building className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">{meeting.building}</span>
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
          View Details
        </button>
        {isHosted && (
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            Edit
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Meetings Hosted</p>
                <p className="text-3xl font-bold text-gray-900">{hostedMeetings.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Invited To</p>
                <p className="text-3xl font-bold text-gray-900">{invitedMeetings.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Today&apos;s Meetings</p>
                <p className="text-3xl font-bold text-gray-900">{upcomingMeetings.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 text-white shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today&apos;s Schedule - Feb 17, 2026
          </h2>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 px-3 py-1 rounded-lg">
                    <span className="font-semibold">{meeting.time}</span>
                  </div>
                  <div>
                    <p className="font-medium">{meeting.title}</p>
                    <p className="text-sm text-white/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {meeting.location}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" />
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('hosted')}
              className={`pb-4 px-1 font-medium transition-colors relative ${
                activeTab === 'hosted'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Meetings I Host ({hostedMeetings.length})
              {activeTab === 'hosted' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('invited')}
              className={`pb-4 px-1 font-medium transition-colors relative ${
                activeTab === 'invited'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Meetings I&apos;m Invited To ({invitedMeetings.length})
              {activeTab === 'invited' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Meeting Cards */}
        <div className="space-y-4">
          {activeTab === 'hosted' ? (
            filteredHostedMeetings.length > 0 ? (
              filteredHostedMeetings.map(meeting => (
                <MeetingCard key={meeting.id} meeting={meeting} isHosted={true} />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
                <p className="text-gray-600 mb-4">Start by creating your first meeting</p>
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 font-medium">
                  <Plus className="w-5 h-5" />
                  Create Meeting
                </button>
              </div>
            )
          ) : (
            filteredInvitedMeetings.length > 0 ? (
              filteredInvitedMeetings.map(meeting => (
                <MeetingCard key={meeting.id} meeting={meeting} isHosted={false} />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations found</h3>
                <p className="text-gray-600">You don&apos;t have any meeting invitations yet</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}