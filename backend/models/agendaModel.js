export function createAgenda({ meetingId, steepness, items }) {
  return {
    meetingId,
    generatedAt: new Date(),
    steepness: steepness ?? 0.5,
    items: items || [],
  };
}
 
