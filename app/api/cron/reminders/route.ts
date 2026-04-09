import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import Meeting from '@/src/models/meeting';
import { sendMeetingReminderEmail } from '@/src/lib/email';

// This endpoint should be called every minute by a cron service
export async function GET(req: NextRequest) {
  try {
    await db;

    const now = new Date();
    // Use a 5-minute window to ensure we don't miss meetings due to slight cron delays
    const windowStart = new Date(now.getTime() - 60 * 1000); 
    const windowEnd = new Date(now.getTime() + 2 * 60 * 1000); // Check 2 mins ahead

    // 1. Fetch upcoming meetings that haven't had reminders sent
    const upcomingMeetings = await Meeting.find({
      status: 'upcoming',
      reminderSent: { $ne: true },
      // Optimization: only check meetings for "today"
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      }
    }).lean();

    const remindersSent = [];

    for (const meeting of upcomingMeetings) {
      // 2. Parse the time string (e.g., "10:30 AM") into a Date object
      const meetingDateTime = combineDateAndTime(meeting.date, meeting.time);

      // 3. Check if meeting starts in the next ~1 minute (or is slightly in the past but within window)
      const diffMs = meetingDateTime.getTime() - now.getTime();
      const diffMins = diffMs / (1000 * 60);

      // We send if it's starting in less than 2 minutes and at least 0 minutes (or very recently past)
      if (diffMins >= -1 && diffMins <= 2) {
        // 4. Send emails to participants
        const participants = [
          { name: meeting.organizer.name, email: meeting.organizer.email },
          ...meeting.attendees
            .filter(a => a.status === 'accepted' || a.status === 'pending')
            .map(a => ({ name: a.name, email: a.email }))
        ];

        for (const person of participants) {
          try {
            await sendMeetingReminderEmail({
              to: person.email,
              meetingTitle: meeting.title,
              meetingTime: meeting.time,
              meetingDate: meeting.date.toLocaleDateString('en-IN'),
              meetingLink: meeting.meetingLink,
              organizerName: meeting.organizer.name || meeting.organizer.email,
            });
          } catch (emailError) {
            console.error(`Failed to send reminder to ${person.email}:`, emailError);
          }
        }

        // 5. Mark as sent
        await Meeting.updateOne({ _id: meeting._id }, { $set: { reminderSent: true } });
        remindersSent.push(meeting.title);
      }
    }

    return NextResponse.json({
      success: true,
      processed: upcomingMeetings.length,
      sent: remindersSent,
    });
  } catch (error) {
    console.error('[GET /api/cron/reminders]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Combines a Date object (day) and a time string (HH:mm AM/PM) 
 * into a single Date object, assuming IST (+5:30) timezone for the time string.
 */
function combineDateAndTime(date: Date, timeStr: string): Date {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);

  // Since the user is in India (IST), we adjust the result.
  // In a real app, you'd use a library like luxon or date-fns-tz.
  // We assume the stored date+time is relative to IST.
  // If the server is in UTC, we need to subtract 5.5 hours to get the actual UTC start time.
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(result.getTime() - istOffset);
}
