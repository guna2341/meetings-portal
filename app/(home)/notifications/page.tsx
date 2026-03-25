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
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          Notifications
          <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-tighter">
            {invitations.length} New
          </span>
        </h1>
        
        <button 
          onClick={() => router.push("/dashboard")}
          className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors"
        >
          View Dashboard
        </button>
      </div>

      {invitations.length === 0 ? (
        <div className="py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400 font-medium">
          No pending notifications to show.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {invitations.map((meeting, index) => (
              <div
                key={meeting._id}
                className="group flex flex-col md:flex-row md:items-center gap-4 p-5 hover:bg-gray-50/80 transition-all duration-200 animate-in fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Left: Indicator */}
                <div className="hidden md:block w-1 h-8 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* Left: Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-black text-gray-600 border border-gray-200">
                    {meeting.organizer?.name?.[0] || 'U'}
                  </div>
                </div>

                {/* Middle: Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 mb-1">
                    <h3 className="text-[15px] font-bold text-gray-900 truncate tracking-tight">
                      {meeting.title}
                    </h3>
                    <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                       {meeting.meetingType}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <User size={14} className="text-gray-400" />
                      <span className="text-gray-900">{meeting.organizer?.name || meeting.organizer?.email}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{new Date(meeting.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {meeting.time}</span>
                    </span>
                    {meeting.location && (
                       <span className="flex items-center gap-1.5 truncate text-gray-400">
                         <MapPin size={14} />
                         <span className="truncate">{meeting.location}</span>
                       </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 mt-4 md:mt-0 md:pl-6 md:border-l border-gray-100">
                  <button
                    onClick={() => handleRsvp(meeting._id, "accepted")}
                    disabled={actionLoading === `${meeting._id}-accepted` || actionLoading === `${meeting._id}-declined`}
                    className="flex-1 md:flex-none h-9 px-5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 font-bold text-xs"
                  >
                     {actionLoading === `${meeting._id}-accepted` ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Accept"
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleRsvp(meeting._id, "declined")}
                    disabled={actionLoading === `${meeting._id}-accepted` || actionLoading === `${meeting._id}-declined`}
                    className="flex-1 md:flex-none h-9 px-4 bg-white text-gray-500 border border-gray-200 rounded-lg hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50 font-bold text-xs"
                  >
                    {actionLoading === `${meeting._id}-declined` ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Decline"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer Info */}
      <div className="mt-12 text-center border-t border-gray-50 pt-8">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">End of Notifications</p>
      </div>
    </div>
  );
}
