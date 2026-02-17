'use client';

import { useState } from 'react';
import { Search, Bell, ChevronDown, Calendar, Clock, User, Settings, HelpCircle, LogOut, Menu } from 'lucide-react';

interface Notification {
  id: number;
  type: 'meeting' | 'task' | 'reminder' | 'update';
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

interface HeaderProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications: Notification[] = [
    {
      id: 1,
      type: 'meeting',
      title: 'Meeting starting soon',
      message: 'Team Standup starts in 15 minutes',
      time: '5 min ago',
      unread: true
    },
    {
      id: 2,
      type: 'task',
      title: 'New task assigned',
      message: 'Sarah assigned you "Prepare Q1 Report"',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      type: 'reminder',
      title: 'Meeting reminder',
      message: 'Design Review Session tomorrow at 3:00 PM',
      time: '2 hours ago',
      unread: false
    },
    {
      id: 4,
      type: 'update',
      title: 'Task completed',
      message: 'Michael completed "Finalize Budget Proposal"',
      time: '3 hours ago',
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Menu Button & Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen?.(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">MeetHub</h1>
              </div>
            </div>
          </div>

          {/* Center Section - Search Bar (hidden on mobile) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search meetings, tasks, people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Right Section - Actions & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Current Date/Time */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div className="w-px h-4 bg-gray-300" />
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Notifications */}
            {/* <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                            notification.unread ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <button className="w-full text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">
                        View all notifications
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div> */}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">JD</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
                    {/* User Info */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">JD</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">John Doe</p>
                          <p className="text-xs text-gray-500 truncate">john.doe@company.com</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">My Profile</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">My Calendar</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Settings</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <HelpCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Help & Support</span>
                      </button>
                    </div>

                    <div className="p-2 border-t border-gray-200">
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left text-red-600">
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>
    </header>
  );
}