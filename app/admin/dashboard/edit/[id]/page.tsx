'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, MapPin, Building, ArrowLeft, Save, X, Plus, Trash2, UserPlus, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Attendee {
  id: number;
  name: string;
  email: string;
  status: 'accepted' | 'declined' | 'pending';
}

interface AgendaItem {
  id: number;
  text: string;
}

export default function MeetingEditPage() {
  const router = useRouter();

  // Sample meeting data - in real app, this would come from props or API based on meeting ID
  const [title, setTitle] = useState('Q1 Planning Review');
  const [description, setDescription] = useState('Quarterly planning and goal setting session for Q1 2026. We will discuss budget allocation, team objectives, key performance indicators, and strategic initiatives for the upcoming quarter.');
  const [date, setDate] = useState('2026-02-20');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('Conference Room A');
  const [building, setBuilding] = useState('Main Office - 3rd Floor');
  
  const [attendees, setAttendees] = useState<Attendee[]>([
    { id: 1, name: 'Sarah Johnson', email: 'sarah.j@company.com', status: 'accepted' },
    { id: 2, name: 'Michael Chen', email: 'michael.c@company.com', status: 'accepted' },
    { id: 3, name: 'Emma Davis', email: 'emma.d@company.com', status: 'pending' },
    { id: 4, name: 'Alex Kumar', email: 'alex.k@company.com', status: 'accepted' },
  ]);

  const [agenda, setAgenda] = useState<AgendaItem[]>([
    { id: 1, text: 'Opening remarks and objectives' },
    { id: 2, text: 'Q4 performance review' },
    { id: 3, text: 'Q1 budget allocation discussion' },
    { id: 4, text: 'Team goals and KPIs setting' },
    { id: 5, text: 'Strategic initiatives presentation' },
    { id: 6, text: 'Q&A and open discussion' },
    { id: 7, text: 'Action items and next steps' },
  ]);

  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      // Redirect to meeting details after successful save
      router.push('/admin/meeting/1');
    }, 2000);
  };

  const handleCancel = () => {
    setShowUnsavedWarning(true);
  };

  const confirmCancel = () => {
    router.back();
  };

  const addAttendee = () => {
    if (newAttendeeEmail && newAttendeeEmail.includes('@')) {
      const newAttendee: Attendee = {
        id: attendees.length + 1,
        name: newAttendeeEmail.split('@')[0].replace('.', ' '),
        email: newAttendeeEmail,
        status: 'pending'
      };
      setAttendees([...attendees, newAttendee]);
      setNewAttendeeEmail('');
    }
  };

  const removeAttendee = (id: number) => {
    setAttendees(attendees.filter(a => a.id !== id));
  };

  const addAgendaItem = () => {
    if (newAgendaItem.trim()) {
      const newItem: AgendaItem = {
        id: agenda.length + 1,
        text: newAgendaItem
      };
      setAgenda([...agenda, newItem]);
      setNewAgendaItem('');
    }
  };

  const removeAgendaItem = (id: number) => {
    setAgenda(agenda.filter(a => a.id !== id));
  };

  const updateAgendaItem = (id: number, text: string) => {
    setAgenda(agenda.map(a => a.id === id ? { ...a, text } : a));
  };

  return (
    <div className="max-w-5xl mx-auto pt-10 pb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Cancel</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Editing Meeting</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Meeting</h1>

        {/* Basic Information Section */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter meeting title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Enter meeting description"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
            />
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Time *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                min="15"
                step="15"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>
          </div>

          {/* Location Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Conference Room A"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                Building *
              </label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="Main Office - 3rd Floor"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Attendees Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Attendees ({attendees.length})
            </h2>
          </div>

          {/* Add Attendee */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="email"
                value={newAttendeeEmail}
                onChange={(e) => setNewAttendeeEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAttendee()}
                placeholder="Enter email address"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={addAttendee}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Attendees List */}
          <div className="space-y-2">
            {attendees.map((attendee) => (
              <div
                key={attendee.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {attendee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{attendee.name}</p>
                    <p className="text-xs text-gray-500">{attendee.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeAttendee(attendee.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {attendees.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No attendees added yet</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Agenda Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Agenda ({agenda.length} items)
            </h2>
          </div>

          {/* Add Agenda Item */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newAgendaItem}
              onChange={(e) => setNewAgendaItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAgendaItem()}
              placeholder="Enter agenda item"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={addAgendaItem}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Agenda List */}
          <div className="space-y-2">
            {agenda.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateAgendaItem(item.id, e.target.value)}
                  className="flex-1 px-3 py-2 border-0 bg-transparent focus:outline-none text-sm text-gray-900"
                />
                <button
                  onClick={() => removeAgendaItem(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {agenda.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No agenda items added yet</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title || !date || !time || !location || !building}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Unsaved Changes</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              You have unsaved changes. Are you sure you want to leave? All changes will be lost.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUnsavedWarning(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Continue Editing
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}