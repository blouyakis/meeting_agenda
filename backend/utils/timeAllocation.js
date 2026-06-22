function parseLocalDate(str) {
  const [date, time] = str.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, min] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, min);
}

function formatTime(date) {
  const h = date.getHours();
  const min = String(date.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

export function allocateTopicTimes(topics, startTime, endTime) {
  if (!topics || topics.length === 0) return [];
  const start = parseLocalDate(startTime);
  const end = parseLocalDate(endTime);
  const totalMinutes = (end - start) / 60000;

  const sorted = [...topics].sort((a, b) => a.priority - b.priority);
  const totalWeight = sorted.reduce((sum, t) => sum + 1 / t.priority, 0);
  if (totalWeight === 0) return sorted;

  let cursor = new Date(start);
  return sorted.map((t, i) => {
    const share = 1 / t.priority / totalWeight;
    const minutes =
      i === sorted.length - 1
        ? Math.round((end - cursor) / 60000)
        : Math.round(share * totalMinutes);
    const topicStart = formatTime(cursor);
    cursor = new Date(cursor.getTime() + minutes * 60000);
    return { ...t, topicStart, minutes };
  });
}
