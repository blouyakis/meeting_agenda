// { _id, userId, title, location, startTime, endTime, topics: [{ text, priority }], attendeeIds: [], createdAt }
export function createMeeting({ userId, title, location, startTime, endTime, topics, attendeeIds }) {
  return {
    userId,
    title,
    location,
    startTime,
    endTime,
    topics: topics || [],
    attendeeIds: attendeeIds || [],
    createdAt: new Date(),
  };
}
