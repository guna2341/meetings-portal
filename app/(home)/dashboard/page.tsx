"use client"

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Search, Filter, MoreVertical, MapPin, User, ChevronRight, Building, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Meeting {
  _id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  attendees: { name: string; email: string; status: string }[];
  status: 'upcoming' | 'completed' | 'cancelled';
  location: string;
  building: string;
  description: string;
  organizer: { name: string; email: string; userId: string };
}

interface DashboardData {
  stats: {
    hostedCount: number;
    invitedCount: number;
    todayCount: number;
  };
  todayMeetings: Meeting[];
  hostedMeetings: Meeting[];
  invitedMeetings: Meeting[];
}

interface MeetingCardProps {
  meeting: Meeting;
  isHosted: boolean;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'hosted' | 'invited'>('hosted');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to load dashboard');
        }
      } catch (err) {
        setError('Network error - please check your connection');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  function handleRoute(id: string, route: string) {
    if (route === 'view') {
      router.push(`/meetings/${id}`);
    } else {
      router.push(`/meetings/edit/${id}`);
    }
  }

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const hostedMeetings = data?.hostedMeetings || [];
  const invitedMeetings = data?.invitedMeetings || [];
  const todayMeetings = data?.todayMeetings || [];

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
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${meeting.status === 'upcoming'
                ? 'bg-blue-50 text-blue-700'
                : meeting.status === 'completed'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
              {meeting.status}
            </span>
          </div>
          {!isHosted && meeting.organizer && (
            <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
              <User className="w-4 h-4" />
              Hosted by {meeting.organizer.name || meeting.organizer.email}
            </p>
          )}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{meeting.description || 'No description provided.'}</p>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
          <span className="text-sm">{meeting.attendees?.length || 0} attendees</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm truncate">{meeting.location || 'No location set'}</span>
        </div>
      </div>

      {meeting.building && (
        <div className="flex items-center gap-2 text-gray-600 mb-4 bg-gray-50 rounded-lg p-3">
          <Building className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">{meeting.building}</span>
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer" onClick={() => handleRoute(meeting._id, "view")}>
          View Details
        </button>
        {isHosted && (
          <button className="cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium" onClick={() => handleRoute(meeting._id, "edit")}>
            Edit
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Meetings Hosted</p>
                <p className="text-3xl font-bold text-gray-900">{data?.stats.hostedCount || 0}</p>
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
                <p className="text-3xl font-bold text-gray-900">{data?.stats.invitedCount || 0}</p>
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
                <p className="text-3xl font-bold text-gray-900">{data?.stats.todayCount || 0}</p>
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
            Today&apos;s Schedule - {currentDateStr}
          </h2>
          <div className="space-y-3">
            {todayMeetings.length > 0 ? (
              todayMeetings.map((meeting) => (
                <div key={meeting._id} className="flex items-center justify-between bg-white/10 backdrop-blur rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors" onClick={() => handleRoute(meeting._id, "view")}>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 px-3 py-1 rounded-lg min-w-[90px] text-center">
                      <span className="font-semibold">{meeting.time}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{meeting.title}</p>
                      <p className="text-sm text-white/80 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{meeting.location || 'No location set'}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                </div>
              ))
            ) : (
              <p className="text-white/70 text-sm italic">No meetings scheduled for today.</p>
            )}
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
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('hosted')}
              className={`pb-4 px-1 font-medium transition-colors relative ${activeTab === 'hosted'
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
              className={`pb-4 px-1 font-medium transition-colors relative ${activeTab === 'invited'
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
                <MeetingCard key={meeting._id} meeting={meeting} isHosted={true} />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
                <p className="text-gray-600 mb-4">Start by creating your first meeting</p>
                <button
                  onClick={() => router.push('/create-meet')}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create Meeting
                </button>
              </div>
            )
          ) : (
            filteredInvitedMeetings.length > 0 ? (
              filteredInvitedMeetings.map(meeting => (
                <MeetingCard key={meeting._id} meeting={meeting} isHosted={false} />
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
