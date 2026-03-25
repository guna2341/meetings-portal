"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Building,
} from "lucide-react";

interface Meeting {
  _id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  location?: string;
  building?: string;
  meetingType: "online" | "offline" | "hybrid";
  organizer: { name: string; email: string; userId: string };
}

export default function NotificationsPage() {
  const [invitations, setInvitations] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications/count");
      const json = await res.json();
      if (json.success) {
        setInvitations(json.pendingInvitations || []);
      } else {
        setError(json.message || "Failed to load notifications");
      }
    } catch (err) {
      setError("Network error fetching notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRsvp = async (meetingId: string, action: "accepted" | "declined") => {
    setActionLoading(`${meetingId}-${action}`);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();

      if (json.success) {
        // Remove the handled invitation from the list
        setInvitations((prev) => prev.filter((m) => m._id !== meetingId));
      } else {
        alert(json.message || "Failed to update RSVP status");
      }
    } catch (error) {
      alert("Network error updating status");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center bg-red-50 p-6 rounded-xl border border-red-100 max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={fetchNotifications}
            className="mt-4 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg shadow-sm hover:bg-red-50"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shadow-sm">
          <Bell className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">Manage your pending meeting invitations</p>
        </div>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">You're all caught up!</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            There are currently no new meeting requests awaiting your response. Return to the dashboard to see your upcoming schedule.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {invitations.map((meeting) => (
            <div
              key={meeting._id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>
              
              <div className="flex justify-between items-start mb-4 pl-2">
                <h3 className="text-lg font-bold text-gray-900 pr-4 leading-tight">
                  {meeting.title}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shrink-0 ${
                  meeting.meetingType === 'online' ? 'bg-blue-100 text-blue-700' :
                  meeting.meetingType === 'hybrid' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {meeting.meetingType}
                </span>
              </div>

              <div className="space-y-3 mb-6 pl-2">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>
                    Invited by <span className="font-medium text-gray-900">{meeting.organizer?.name || meeting.organizer?.email}</span>
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-800">
                    {new Date(meeting.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 mx-1"></span>
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-800">{meeting.time} <span className="text-gray-500 font-normal text-xs">({meeting.duration})</span></span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="truncate">
                    {meeting.meetingType === 'online' ? 'Virtual Meeting' : (meeting.location || 'No location set')}
                  </span>
                </div>
                
                {meeting.building && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{meeting.building}</span>
                    </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 pl-2">
                <button
                  onClick={() => handleRsvp(meeting._id, "accepted")}
                  disabled={actionLoading === `${meeting._id}-accepted` || actionLoading === `${meeting._id}-declined`}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {actionLoading === `${meeting._id}-accepted` ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Accept
                </button>
                <button
                  onClick={() => handleRsvp(meeting._id, "declined")}
                  disabled={actionLoading === `${meeting._id}-accepted` || actionLoading === `${meeting._id}-declined`}
                  className="flex-1 px-4 py-2.5 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {actionLoading === `${meeting._id}-declined` ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
