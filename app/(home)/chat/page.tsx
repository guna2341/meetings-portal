"use client"

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Send, Image as ImageIcon, Users, MessageSquare, 
  Plus, Loader2, ArrowLeft, Phone, MoreVertical, 
  CheckCheck, Pin, Eye, Smile, Mic, X, Trash2, StopCircle, Play, PauseCircle
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  createdAt: string;
  readBy: string[];
}

interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  participants: User[];
  meetingId?: {
    _id: string;
    title: string;
  };
  lastMessage?: string;
  unreadCount?: number;
  isPinned?: boolean;
  updatedAt: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [innerSearchQuery, setInnerSearchQuery] = useState('');
  const [isInnerSearchOpen, setIsInnerSearchOpen] = useState(false);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Playback state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [key: string]: number }>({});
  
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const IMGBB_API_KEY = '621c7b2398f5e7c28a854485090a2db4';
  const EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '🔥', '🤔', '😎', '🙌', '✨', '🎉', '💙', '🚀', '📍', '✅', '❌', '💯', '❤️', '🎈', '⭐'];

  useEffect(() => {
    setIsMounted(true);
    fetchCurrentUser();
    fetchConversations();
    const convInterval = setInterval(fetchConversations, 5000);
    return () => clearInterval(convInterval);
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
      setConversations(prev => prev.map(c => 
        c._id === activeChat._id ? { ...c, unreadCount: 0 } : c
      ));
      const msgInterval = setInterval(() => fetchMessages(activeChat._id, true), 3000);
      return () => clearInterval(msgInterval);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, innerSearchQuery]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.success) setCurrentUser(data.data);
    } catch (err) {
      console.error("Failed to fetch current user", err);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  };

  const fetchMessages = async (conversationId: string, isPolling = false) => {
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      const data = await res.json();
      if (data.success) {
        if (!isPolling || data.data.length !== messages.length) {
          setMessages(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const togglePin = (convId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConversations(prev => prev.map(c => 
      c._id === convId ? { ...c, isPinned: !c.isPinned } : c
    ));
  };

  const scrollToBottom = () => {
    if (!isInnerSearchOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${query}`);
      const data = await res.json();
      if (data.success) setSearchResults(data.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const startDirectChat = async (user: User) => {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'direct', participantId: user._id }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveChat(data.data);
        setSearchQuery('');
        setSearchResults([]);
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to start direct chat", err);
    }
  };

  // Voice Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error("Failed to access microphone", err);
      alert("Microphone access is required for voice recording.");
    }
  };

  const stopRecordingAndSend = () => {
    if (!mediaRecorder) return;
    
    const finalSeconds = recordingTime;
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
      
      // Stop all tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        await sendMessage(undefined, undefined, base64Audio, finalSeconds);
      };
      
      setIsRecording(false);
      setMediaRecorder(null);
      audioChunksRef.current = [];
    };
    
    mediaRecorder.stop();
  };

  const cancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      audioChunksRef.current = [];
    }
  };

  const sendMessage = async (e?: React.FormEvent, imageUrl?: string, audioUrl?: string, durationSecs?: number) => {
    if (e) e.preventDefault();
    if (!activeChat || (!newMessage.trim() && !imageUrl && !audioUrl)) return;

    let content = newMessage;
    if (audioUrl) {
      content = `[VOICE]${formatRecordTime(durationSecs || recordingTime)}`;
    }
    
    setNewMessage(''); 

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeChat._id,
          content,
          imageUrl,
          audioUrl
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        fetchConversations(); 
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        await sendMessage(undefined, data.data.url);
      }
    } catch (err) {
      console.error("Image upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleVoicePlayback = (id: string, url: string, durationStr: string) => {
    if (!url) return;
    
    if (playingVoiceId === id) {
      audioRef.current?.pause();
      setPlayingVoiceId(null);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      }
      
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingVoiceId(id);
      
      // Parse duration from string (e.g. "0:05") if needed as fallback
      const [m, s] = durationStr.split(':').map(Number);
      const estimatedDuration = (m * 60) + s;

      audio.play().catch(err => {
        console.error("Playback failed", err);
        setPlayingVoiceId(null);
      });
      
      playbackIntervalRef.current = setInterval(() => {
        if (audio.ended) {
          setPlayingVoiceId(null);
          setPlaybackProgress(prev => ({ ...prev, [id]: 0 }));
          if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
        } else {
          // Use estimated duration if actual duration is Infinity (common in webm)
          const duration = (audio.duration && isFinite(audio.duration)) ? audio.duration : estimatedDuration;
          const progress = (audio.currentTime / duration) * 100;
          setPlaybackProgress(prev => ({ ...prev, [id]: Math.min(progress, 100) }));
        }
      }, 100);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== currentUser?._id);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const formatRecordTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(innerSearchQuery.toLowerCase())
  );

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F3F4FF]">
        <Loader2 className="w-10 h-10 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#F8F9FE] overflow-hidden">
      {/* Sidebar - Conversations */}
      <div className={`w-full md:w-[350px] lg:w-[400px] border-r border-[#EEF0FF] flex flex-col bg-white ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-gray-900">Messages</h1>
            <div className="px-3 py-1 rounded-xl bg-[#EEF0FF] flex items-center justify-center text-[#6366F1] font-bold text-sm">
              {conversations.filter(c => c.unreadCount).length} New
            </div>
          </div>
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-12 pr-4 py-3 bg-[#F3F4FF] border-none rounded-xl text-sm placeholder-gray-400 focus:ring-2 focus:ring-[#6366F1] transition-all"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            
            {/* Search Results Dropdown */}
            {searchQuery.length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#EEF0FF] rounded-2xl shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-6 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#6366F1]" /></div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <button
                      key={user._id}
                      onClick={() => startDirectChat(user)}
                      className="w-full p-4 text-left hover:bg-[#F3F4FF] border-b border-[#EEF0FF] last:border-0 flex items-center gap-4 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#6366F1] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {user.name} {user._id === currentUser?._id && <span className="text-xs text-[#6366F1] font-normal ml-1">(yourself)</span>}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 text-sm">No users found</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scroll">
          {conversations.length > 0 ? (
            conversations.map(conv => {
              const otherParticipant = conv.type === 'direct' 
                ? conv.participants.find(p => p._id !== currentUser?._id)
                : null;
              let title = conv.type === 'group' ? conv.meetingId?.title || 'Meeting Chat' : otherParticipant?.name || 'User';
              
              if (conv.type === 'direct' && !otherParticipant && currentUser) {
                title = `${currentUser.name} (yourself)`;
              }

              const isActive = activeChat?._id === conv._id;

              return (
                <button
                  key={conv._id}
                  onClick={() => setActiveChat(conv)}
                  className={`w-full p-4 flex items-center gap-4 rounded-2xl transition-all duration-200 ${isActive ? 'bg-[#EEF0FF]' : 'hover:bg-slate-50'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden ${conv.type === 'group' ? 'bg-amber-100 text-amber-600' : 'bg-[#D1D5FF] text-[#4F46E5]'}`}>
                    {conv.type === 'group' ? <Users className="w-7 h-7" /> : title.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`text-sm font-bold truncate ${isActive ? 'text-gray-900' : 'text-gray-800'}`}>
                        {title}
                      </h3>
                      <span className="text-[10px] font-medium text-gray-400 shrink-0">
                        {formatTime(conv.updatedAt)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">
                        {conv.lastMessage?.includes('[VOICE]') ? '🎤 Voice message' : conv.lastMessage || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {conv.isPinned && <Pin className="w-3.5 h-3.5 text-[#A5B4FC] rotate-45 fill-[#A5B4FC]" />}
                        {conv.unreadCount ? (
                          <span className="w-5 h-5 rounded-full bg-[#FF7E5F] text-white text-[10px] flex items-center justify-center font-bold">
                            {conv.unreadCount}
                          </span>
                        ) : (
                          <CheckCheck className="w-4 h-4 text-[#A5B4FC]" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No chats yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 h-full relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-[#EEF0FF]">
              <MessageSquare className="w-10 h-10 text-[#6366F1]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Select a chat</h2>
            <p className="text-gray-500 text-sm mt-1">Pick a conversation from the list to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-6 bg-white border-b border-[#EEF0FF] flex flex-col sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4 min-w-0">
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="md:hidden p-2 hover:bg-slate-50 rounded-lg text-gray-500"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-black text-gray-900 truncate">
                      {activeChat.type === 'group' ? activeChat.meetingId?.title : (getOtherParticipant(activeChat)?.name || (currentUser?.name && `${currentUser.name} (yourself)`) || 'Chat')}
                    </h2>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsInnerSearchOpen(!isInnerSearchOpen);
                      if (isInnerSearchOpen) setInnerSearchQuery('');
                    }}
                    className={`p-3 rounded-2xl transition-all ${isInnerSearchOpen ? 'bg-[#6366F1] text-white' : 'text-gray-400 hover:text-[#6366F1] hover:bg-[#EEF0FF]'}`}
                  >
                    <Search className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => togglePin(activeChat._id)}
                    className={`p-3 rounded-2xl transition-all ${conversations.find(c => c._id === activeChat._id)?.isPinned ? 'text-[#6366F1] bg-[#EEF0FF]' : 'text-gray-400 hover:text-[#6366F1] hover:bg-[#EEF0FF]'}`}
                  >
                    <Pin className={`w-6 h-6 ${conversations.find(c => c._id === activeChat._id)?.isPinned ? 'fill-[#6366F1] rotate-45' : ''}`} />
                  </button>
                </div>
              </div>

              {isInnerSearchOpen && (
                <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search messages..."
                      className="w-full pl-10 pr-10 py-3 bg-[#F3F4FF] border-none rounded-xl text-sm placeholder-gray-400"
                      value={innerSearchQuery}
                      onChange={(e) => setInnerSearchQuery(e.target.value)}
                    />
                    {innerSearchQuery && (
                      <button 
                        onClick={() => setInnerSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 p-1 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#F8F9FE] custom-scroll">
              <div className="flex flex-col gap-6">
                {filteredMessages.map((msg, i) => {
                  const isOwn = msg.senderId._id === currentUser?._id;
                  const showAvatar = !isOwn && (i === 0 || filteredMessages[i-1].senderId._id !== msg.senderId._id);
                  const isVoice = msg.content.startsWith('[VOICE]');
                  const voiceDuration = isVoice ? msg.content.replace('[VOICE]', '') : '';

                  return (
                    <div key={msg._id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-end gap-3 max-w-[85%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isOwn && (
                          <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0 scale-0'}`}>
                            {msg.senderId.avatar ? (
                              <img src={msg.senderId.avatar} alt={msg.senderId.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                {msg.senderId.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-1.5 min-w-0">
                          {!isOwn && showAvatar && (
                            <span className="text-[11px] font-bold text-gray-400 ml-1 mb-1">{msg.senderId.name}</span>
                          )}
                          
                          <div className={`group relative p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isOwn 
                              ? 'bg-[#6366F1] text-white rounded-br-none' 
                              : 'bg-white text-gray-800 rounded-bl-none border border-[#EEF0FF]'
                          }`}>
                            {msg.imageUrl && (
                              <div className="mb-3 rounded-xl overflow-hidden shadow-inner cursor-zoom-in">
                                <img src={msg.imageUrl} alt="Attachment" className="max-w-full h-auto hover:scale-105 transition-transform duration-500" />
                              </div>
                            )}
                            
                            {isVoice ? (
                              <div className="flex items-center gap-4 py-1 pr-6 min-w-[200px]">
                                <button 
                                  onClick={() => toggleVoicePlayback(msg._id, msg.audioUrl || '', voiceDuration)}
                                  className={`p-3 rounded-full shadow-md transition-all active:scale-95 ${isOwn ? 'bg-white text-[#6366F1]' : 'bg-[#6366F1] text-white'}`}
                                >
                                  {playingVoiceId === msg._id ? <PauseCircle className="w-6 h-6 animate-pulse" /> : <Play className="w-6 h-6 fill-current" />}
                                </button>
                                <div className="flex-1 flex flex-col gap-1.5">
                                  <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden relative">
                                    <div 
                                      className={`absolute top-0 left-0 h-full transition-all duration-300 ${isOwn ? 'bg-white' : 'bg-[#6366F1]'}`}
                                      style={{ width: `${playbackProgress[msg._id] || 0}%` }}
                                    />
                                  </div>
                                  <div className={`flex justify-between text-[10px] font-bold ${isOwn ? 'text-white/80' : 'text-gray-400'}`}>
                                    <span>{playingVoiceId === msg._id ? 'Playing...' : voiceDuration}</span>
                                    <span>{voiceDuration}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                            
                            <div className={`flex items-center gap-2 mt-2 ${isOwn ? 'justify-end text-white/60' : 'justify-start text-gray-400'}`}>
                              <span className="text-[10px] font-medium opacity-80">{formatTime(msg.createdAt)}</span>
                              {isOwn && <CheckCheck className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-[#EEF0FF]">
              <form onSubmit={sendMessage} className="flex gap-4 items-center">
                {!isRecording && (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-gray-400 hover:text-[#6366F1] hover:bg-[#EEF0FF] rounded-2xl transition-all shrink-0"
                  >
                    <Plus className="w-7 h-7" />
                  </button>
                )}
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                />
                
                <div className="flex-1 relative">
                  {isRecording ? (
                    <div className="w-full flex items-center justify-between px-5 py-4 bg-[#FFF0F0] border-none rounded-2xl shadow-inner">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                        <span className="text-red-500 font-bold text-sm tracking-wide">Recording {formatRecordTime(recordingTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={cancelRecording}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button 
                          type="button" 
                          onClick={stopRecordingAndSend}
                          className="p-3 text-white bg-red-500 rounded-xl shadow-lg hover:bg-red-600 transition-all hover:scale-105"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Type something..."
                        className="w-full pl-5 pr-24 py-4 bg-[#F3F4FF] border-none rounded-2xl text-gray-800 focus:ring-2 focus:ring-[#6366F1] transition-all font-medium placeholder-gray-400"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onFocus={() => setIsEmojiPickerOpen(false)}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <div className="relative">
                          <button 
                            type="button" 
                            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                            className={`p-2 transition-colors ${isEmojiPickerOpen ? 'text-[#6366F1]' : 'text-gray-400 hover:text-[#6366F1]'}`}
                          >
                            <Smile className="w-5 h-5" />
                          </button>
                          {isEmojiPickerOpen && (
                            <div className="absolute bottom-full right-0 mb-4 p-3 bg-white border border-[#EEF0FF] rounded-2xl shadow-2xl z-50 w-64 animate-in zoom-in-95 duration-200 origin-bottom-right">
                              <div className="grid grid-cols-5 gap-2">
                                {EMOJIS.map(e => (
                                  <button 
                                    key={e} 
                                    type="button" 
                                    onClick={() => addEmoji(e)}
                                    className="text-2xl hover:bg-[#F3F4FF] p-2 rounded-xl transition-colors"
                                  >
                                    {e}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button 
                          type="button" 
                          onClick={startRecording}
                          className="p-2 text-gray-400 hover:text-[#6366F1] transition-colors"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {!isRecording && (
                  <button
                    type="submit"
                    disabled={isUploading || (!newMessage.trim() && !isUploading)}
                    className="p-4 bg-[#6366F1] text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-[#4F46E5] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center shrink-0"
                  >
                    {isUploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7" />}
                  </button>
                )}
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
