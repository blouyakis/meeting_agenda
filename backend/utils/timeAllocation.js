function generateWeights(N, steepness) {
  if (N === 1) return [1.0];

  const base = 1.0 + steepness * 2.0;

  const raw = Array.from({ length: N }, (_, i) => Math.pow(base, N - 1 - i));
  const total = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => w / total);
}

function allocateMinutes(weights, totalMinutes) {
  const floats = weights.map((w) => w * totalMinutes);
  const floored = floats.map((f) => Math.max(1, Math.floor(f)));

  let sum = floored.reduce((a, b) => a + b, 0);

  if (sum > totalMinutes) {
    const excess = sum - totalMinutes;
    const indices = floats
      .map((f, i) => ({ i, val: floored[i] }))
      .sort((a, b) => b.val - a.val)
      .map((x) => x.i);
    for (let i = 0; i < excess; i++) {
      if (floored[indices[i]] > 1) floored[indices[i]] -= 1;
    }
  } else {
    const remainder = totalMinutes - sum;
    const indices = floats
      .map((f, i) => ({ i, frac: f - Math.floor(f) }))
      .sort((a, b) => b.frac - a.frac)
      .map((x) => x.i);
    for (let i = 0; i < remainder; i++) floored[indices[i]] += 1;
  }

  return floored;
}

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

export function allocateTopicTimes(
  topics,
  startTime,
  endTime,
  steepness = 0.5,
) {
  if (!topics || topics.length === 0) return [];
  const start = parseLocalDate(startTime);
  const end = parseLocalDate(endTime);
  const totalMinutes = Math.round((end - start) / 60000);
  const sorted = [...topics].sort((a, b) => a.priority - b.priority);
  const N = sorted.length;
  if (totalMinutes < N) {
    return sorted.map((t, i) => ({
      ...t,
      topicStart: formatTime(new Date(start.getTime() + i * 60000)),
      minutes: 1,
    }));
  }
  const weights = generateWeights(N, steepness);
  const minutes = allocateMinutes(weights, totalMinutes);
  let cursor = new Date(start);
  return sorted.map((t, i) => {
    const topicStart = formatTime(cursor);
    cursor = new Date(cursor.getTime() + minutes[i] * 60000);
    return { ...t, topicStart, minutes: minutes[i] };
  });
}
