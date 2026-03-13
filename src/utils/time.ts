/**
 * Parses a time string (e.g., "10:00 AM") and duration (e.g., "60 min")
 * on a given date into start and end Date objects.
 */
export function getMeetingTimeRange(dateStr: string | Date, timeStr: string, durationStr: string) {
  const date = new Date(dateStr);
  
  // Parse "10:00 AM" or "10:00PM"
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const ampm = timeMatch[3].toUpperCase();

  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);

  // Parse "60 min" or just "60"
  const durationMatch = durationStr.match(/(\d+)/);
  const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;

  const end = new Date(start.getTime() + durationMinutes * 60000);

  return { start, end };
}

/**
 * Checks if two time ranges overlap.
 * (startA < endB) && (endA > startB)
 */
export function areRangesOverlapping(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}
