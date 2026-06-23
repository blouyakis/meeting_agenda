// { _id, userId, title, location, startTime, endTime, topics: [{ text, priority }], attendeeIds: [], createdAt }
export function createMeeting({ userId, title, location, startTime, endTime, topics, attendeeIds, steepness }) {
  return {
    userId,
    title,
    location,
    startTime,
    endTime,
    topics: topics || [],
    attendeeIds: attendeeIds || [],
    steepness: steepness ?? 0.5,
    createdAt: new Date(),
  };
}


