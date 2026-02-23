

import { IMeeting } from "../models/meeting";

export type CreateMeetingPayload = {
  title: string;
  description?: string;
  date: string;           
  time: string;          
  duration?: string;      
  location?: string;
  building?: string;
  status?: 'upcoming' | 'completed' | 'cancelled';
  organizer: {
    name: string;
    email: string;
  };
  attendees?: {
    name: string;
    email: string;
    status?: 'accepted' | 'declined' | 'pending';
  }[];
  agenda?: string[];
  tasks?: {
    title: string;
    assignedTo: string;
    dueDate: string;      
    status?: 'completed' | 'in-progress' | 'pending';
    priority?: 'high' | 'medium' | 'low';
  }[];
  notes?: {
    author: string;
    content: string;
    timestamp?: string;
  }[];
};

export type MeetingListParams = {
  status?: 'upcoming' | 'completed' | 'cancelled';
  organizer?: string;
  page?: number;
  limit?: number;
};

export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string; errors?: Record<string, string[]> };


/**
 * Create a new meeting.
 */
export async function createMeeting(
  payload: CreateMeetingPayload
): Promise<ApiResponse<IMeeting>> {
  const res = await fetch('/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * Fetch a paginated list of meetings.
 */
export async function getMeetings(
  params: MeetingListParams = {}
): Promise<ApiResponse<IMeeting[]> & { pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.organizer) query.set('organizer', params.organizer);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`/api/meetings?${query.toString()}`);
  return res.json();
}

/**
 * Fetch a single meeting by ID.
 */
export async function getMeetingById(
  id: string
): Promise<ApiResponse<IMeeting>> {
  const res = await fetch(`/api/meetings/${id}`);
  return res.json();
}

/**
 * Update a meeting by ID.
 */
export async function updateMeeting(
  id: string,
  payload: Partial<CreateMeetingPayload>
): Promise<ApiResponse<IMeeting>> {
  const res = await fetch(`/api/meetings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * Delete a meeting by ID.
 */
export async function deleteMeeting(
  id: string
): Promise<ApiResponse<null>> {
  const res = await fetch(`/api/meetings/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}