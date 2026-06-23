import { requireAuth, getToken, apiFetch } from "./main.js";
requireAuth();

const meetingId = new URLSearchParams(window.location.search).get("id");
if (!meetingId) window.location.href = "/dashboard.html";

function formatDateTime(str) {
  const [date, time] = str.split("T");
  const [year, month, day] = date.split("-");
  const [hour, min] = time.split(":");
  const h = parseInt(hour);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${month}/${day}/${year}, ${h12}:${min} ${ampm}`;
}

const overlay = document.getElementById("modal-overlay");
function showModal(message) {
  return new Promise((resolve) => {
    document.getElementById("modal-message").textContent = message;
    overlay.classList.remove("hidden");
    document.getElementById("modal-yes").onclick = () => {
      overlay.classList.add("hidden");
      resolve(true);
    };
    document.getElementById("modal-no").onclick = () => {
      overlay.classList.add("hidden");
      resolve(false);
    };
  });
}

async function loadAgenda() {
  const [meetingRes, employeesRes] = await Promise.all([
    apiFetch(`/api/meetings/${meetingId}`),
    apiFetch("/api/employees"),
  ]);
  if (!meetingRes || !employeesRes) return;

  const meeting = await meetingRes.json();
  const allEmployees = await employeesRes.json();

  document.title = `${meeting.title} – Agenda`;
  document.getElementById("agenda-title").textContent = meeting.title;
  document.getElementById("agenda-location").textContent = meeting.location
    ? `📍 ${meeting.location}`
    : "";

  const timeEl = document.getElementById("agenda-time");
  if (meeting.startTime) {
    timeEl.textContent = meeting.endTime
      ? `${formatDateTime(meeting.startTime)} – ${formatDateTime(meeting.endTime)}`
      : `Start: ${formatDateTime(meeting.startTime)}`;
  } else {
    timeEl.textContent = "";
  }

  const steepness = meeting.steepness ?? 0.5;

  renderTopics(meeting, steepness);

  document.getElementById("agenda-topics").addEventListener("input", (e) => {
    if (e.target.classList.contains("action-item-input")) {
      document.getElementById("save-actions-btn").classList.remove("hidden");
    }
  });

  const attendees = allEmployees.filter((e) =>
    meeting.attendeeIds.includes(e._id.toString()),
  );
  document.getElementById("agenda-attendees").innerHTML = attendees.length
    ? attendees.map((a) => `<li>${a.lastName}, ${a.firstName}</li>`).join("")
    : "<li>No attendees selected.</li>";

  document.getElementById("edit-btn").addEventListener("click", () => {
    window.location.href = `meetings.html?id=${meetingId}`;
  });

  document
    .getElementById("generate-pdf-btn")
    .addEventListener("click", async () => {
      await downloadPDF(meeting);
      const alsoEmail = await showModal(
        "Would you also like to email the attendees?",
      );
      if (alsoEmail) await sendEmail();
    });

  document.getElementById("email-btn").addEventListener("click", async () => {
    await sendEmail();
    const alsoPDF = await showModal("Would you also like to generate a PDF?");
    if (alsoPDF) await downloadPDF(meeting);
  });

  document
    .getElementById("save-actions-btn")
    .addEventListener("click", () => saveActionItems(meeting));
}

function renderTopics(meeting, steepness) {
  const topics = allocateTopicTimes(
    meeting.topics,
    meeting.startTime,
    meeting.endTime,
    steepness,
  );
  const list = document.getElementById("agenda-topics");

  list.innerHTML = topics
    .map(
      (t, idx) => `
    <li class="agenda-topic-item" data-index="${idx}">
      <div class="topic-header">
        ${t.topicStart ? `<span class="topic-time">${t.topicStart}</span>` : ""}
        <span class="topic-title-text">${t.text}</span>
        <span class="topic-meta">${t.minutes ? `${t.minutes} min` : ""}</span>
      </div>
      ${t.notes ? `<p class="topic-notes">${t.notes}</p>` : ""}
      <div class="topic-action-items">
        <p class="action-items-label">Action items:</p>
        ${
          t.actionItems?.length
            ? t.actionItems
                .map(
                  (item, i) =>
                    `<input type="text" class="action-item-input" data-topic="${idx}" data-item="${i}" value="${item}" aria-label="Action item ${i + 1}" />`,
                )
                .join("")
            : '<p class="topic-action muted">No action items.</p>'
        }
      </div>
    </li>
  `,
    )
    .join("");

  return topics;
}

async function saveActionItems(meeting) {
  const updatedTopics = meeting.topics.map((t, idx) => {
    const inputs = document.querySelectorAll(
      `.action-item-input[data-topic="${idx}"]`,
    );
    const actionItems = inputs.length
      ? [...inputs].map((inp) => inp.value.trim()).filter(Boolean)
      : t.actionItems || [];
    return { ...t, actionItems };
  });

  const res = await apiFetch(`/api/meetings/${meetingId}`, {
    method: "PUT",
    body: JSON.stringify({ ...meeting, topics: updatedTopics }),
  });

  if (res?.ok) {
    alert("Action items saved!");
  } else {
    alert("Failed to save action items.");
  }
}

async function downloadPDF(meeting) {
  const res = await fetch(`/api/meetings/${meetingId}/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(meeting?.title || "agenda").replace(/[^a-z0-9]/gi, "_")}.pdf`;
  a.click();
}

async function sendEmail() {
  const res = await apiFetch(`/api/meetings/${meetingId}/email`, {
    method: "POST",
  });
  if (!res) return;
  const data = await res.json();
  if (!res.ok) {
    alert(data.error);
    return;
  }
  if (data.skipped?.length) {
    alert(
      `Emails sent.\n\nThe following attendees have no email on file and were skipped:\n• ${data.skipped.join("\n• ")}`,
    );
  } else {
    alert("Emails sent successfully!");
  }
}

function allocateTopicTimes(topics, startTime, endTime, steepness) {
  if (!topics || topics.length === 0) return [];

  function parseLocal(str) {
    const [date, time] = str.split("T");
    const [y, mo, d] = date.split("-").map(Number);
    const [h, mi] = time.split(":").map(Number);
    return new Date(y, mo - 1, d, h, mi);
  }
  function fmt(date) {
    const h = date.getHours();
    const min = String(date.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${min} ${ampm}`;
  }

  if (!startTime || !endTime) {
    return [...topics].sort((a, b) => a.priority - b.priority);
  }

  const start = parseLocal(startTime);
  const end = parseLocal(endTime);
  const totalMinutes = Math.round((end - start) / 60000);
  const sorted = [...topics]
    .filter((t) => t.text?.trim())
    .sort((a, b) => a.priority - b.priority);
  const N = sorted.length;
  const base = 1.0 + (steepness ?? 0.5) * 2.0;
  const raw = Array.from({ length: N }, (_, i) => Math.pow(base, N - 1 - i));
  const total = raw.reduce((a, b) => a + b, 0);
  const weights = raw.map((w) => w / total);
  const floats = weights.map((w) => w * totalMinutes);
  const floored = floats.map((f) => Math.max(1, Math.floor(f)));
  let sum = floored.reduce((a, b) => a + b, 0);
  if (sum > totalMinutes) {
    const excess = sum - totalMinutes;
    const bySize = floats
      .map((f, i) => ({ i, val: floored[i] }))
      .sort((a, b) => b.val - a.val)
      .map((x) => x.i);
    for (let i = 0; i < excess; i++) {
      if (floored[bySize[i]] > 1) floored[bySize[i]] -= 1;
    }
  } else {
    const remainder = totalMinutes - sum;
    const byFrac = floats
      .map((f, i) => ({ i, frac: f - Math.floor(f) }))
      .sort((a, b) => b.frac - a.frac)
      .map((x) => x.i);
    for (let i = 0; i < remainder; i++) floored[byFrac[i]] += 1;
  }
  let cursor = new Date(start);
  return sorted.map((t, i) => {
    const topicStart = fmt(cursor);
    cursor = new Date(cursor.getTime() + floored[i] * 60000);
    return { ...t, topicStart, minutes: floored[i] };
  });
}

loadAgenda();
