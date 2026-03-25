"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, MapPin, MapPinHouse, Users, Clock, Plus, Link as LinkIcon, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Meeting {
  _id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  location?: string;
  building?: string;
  meetingType: "online" | "offline" | "hybrid";
  status: "upcoming" | "completed" | "cancelled";
  meetingLink?: string;
  description?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/calendar");
        const json = await res.json();
        
        if (json.success) {
          // Filter to explicitly only show upcoming or completed meetings from the full fetch pool.
          const allMeetings = json.data.filter((m: Meeting) => m.status === 'upcoming' || m.status === 'completed');
          setMeetings(allMeetings);
        } else {
          setError(json.message || "Failed to load calendar data.");
        }
      } catch (err) {
        setError("Network error fetching calendar.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Helper to determine if a meeting falls on a specific day in the currently viewed month
  const getMeetingsForDay = (day: number) => {
    return meetings.filter(m => {
      const meetDate = new Date(m.date);
      return (
        meetDate.getDate() === day &&
        meetDate.getMonth() === currentDate.getMonth() &&
        meetDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl border border-red-100 shadow-sm max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shadow-sm border border-blue-50">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Calendar</h1>
            <p className="text-gray-500">Track your upcoming and past events graphically</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/create-meet")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Calendar Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 bg-gray-100 gap-px">
          {/* Empty cells before the first day of the month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-50/40 min-h-[120px]"></div>
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();
              
            const dayMeetings = getMeetingsForDay(day);

            return (
              <div
                key={day}
                className={`bg-white min-h-[140px] p-2 transition-colors hover:bg-gray-50/50 ${
                  isToday ? "bg-blue-50/30" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                      isToday ? "bg-blue-600 text-white shadow-sm" : "text-gray-700"
                    }`}
                  >
                    {day}
                  </span>
                  
                  {dayMeetings.length > 0 && (
                     <span className="text-[10px] font-bold text-gray-400 mt-1 mr-1">{dayMeetings.length} event{dayMeetings.length > 1 ? 's' : ''}</span>
                  )}
                </div>

                {/* Meeting Badges */}
                <div className="space-y-1.5 mt-2">
                  {dayMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      onClick={() => router.push(`/dashboard/view/${meeting._id}`)}
                      className="group cursor-pointer px-2 py-1.5 text-xs rounded-md border flex flex-col gap-1 transition-all bg-white hover:shadow-sm hover:border-blue-300 border-gray-200 relative overflow-visible"
                    >
                       <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                         meeting.status === 'upcoming' ? 'bg-blue-400' : 
                         meeting.status === 'completed' ? 'bg-green-400' : 'bg-gray-300'
                       } rounded-l-md`}></div>
                      
                      <div className="font-semibold text-gray-800 truncate pl-1 group-hover:text-blue-700 transition-colors">
                        {meeting.title}
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-500 pl-1">
                        <Clock className="w-3 h-3" />
                        <span className="truncate">{meeting.time}</span>
                      </div>
                      
                      {meeting.description && (
                        <div className="text-[10px] text-gray-500 pl-1 line-clamp-2 mt-0.5 leading-tight">
                          {meeting.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
