import { requireAuth, getToken } from './main.js';
requireAuth();

const meetingId = new URLSearchParams(window.location.search).get('id');
if (!meetingId) window.location.href = '/dashboard.html';

function formatDateTime(str) {
  const [date, time] = str.split('T');
  const [year, month, day] = date.split('-');
  const [hour, min] = time.split(':');
  const h = parseInt(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${month}/${day}/${year}, ${h12}:${min} ${ampm}`;
}

function allocateTopicTimes(topics, startTime, endTime) {
  function parseLocal(str) {
    const [date, time] = str.split('T');
    const [y, mo, d] = date.split('-').map(Number);
    const [h, mi] = time.split(':').map(Number);
    return new Date(y, mo - 1, d, h, mi);
  }
  function fmt(date) {
    const h = date.getHours(), min = String(date.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${min} ${ampm}`;
  }
  const start = parseLocal(startTime);
  const end = parseLocal(endTime);
  const totalMinutes = (end - start) / 60000;
  const sorted = [...topics].sort((a, b) => a.priority - b.priority);
  const totalWeight = sorted.reduce((sum, t) => sum + 1 / t.priority, 0);
  let cursor = new Date(start);
  return sorted.map((t, i) => {
    const share = (1 / t.priority) / totalWeight;
    const minutes = i === sorted.length - 1
      ? Math.round((end - cursor) / 60000)
      : Math.round(share * totalMinutes);
    const topicStart = fmt(cursor);
    cursor = new Date(cursor.getTime() + minutes * 60000);
    return { ...t, topicStart, minutes };
  });
}

async function loadAgenda() {
  const [meetingRes, employeesRes] = await Promise.all([
    fetch(`/api/meetings/${meetingId}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
    fetch('/api/employees', { headers: { Authorization: `Bearer ${getToken()}` } }),
  ]);
  const meeting = await meetingRes.json();
  const allEmployees = await employeesRes.json();

  document.title = `${meeting.title} – Agenda`;
  document.getElementById('agenda-title').textContent = meeting.title;
  document.getElementById('agenda-location').textContent = meeting.location ? `📍 ${meeting.location}` : '';
  const timeEl = document.getElementById('agenda-time');
  if (meeting.startTime) {
    timeEl.textContent = meeting.endTime
      ? `${formatDateTime(meeting.startTime)} – ${formatDateTime(meeting.endTime)}`
      : `Start: ${formatDateTime(meeting.startTime)}`;
  } else {
    timeEl.textContent = '';
  }

  const topics = (meeting.startTime && meeting.endTime)
    ? allocateTopicTimes(meeting.topics, meeting.startTime, meeting.endTime)
    : [...meeting.topics].sort((a, b) => a.priority - b.priority);
  document.getElementById('agenda-topics').innerHTML = topics.map((t) => `
    <li class="agenda-topic-item">
      <div class="topic-header">
        ${t.topicStart ? `<span class="topic-time">${t.topicStart}</span>` : ''}
        <span class="topic-title-text">${t.text}</span>
        <span class="topic-meta">Priority ${t.priority}${t.minutes ? ` &bull; ${t.minutes} min` : ''}</span>
      </div>
      ${t.notes ? `<p class="topic-notes">${t.notes}</p>` : ''}
      ${t.actionItems?.length ? `<p class="topic-action">Action Items: ${t.actionItems.join(', ')}</p>` : ''}
    </li>
  `).join('');

  const attendees = allEmployees.filter((e) => meeting.attendeeIds.includes(e._id.toString()));
  document.getElementById('agenda-attendees').innerHTML = attendees.length
    ? attendees.map((a) => `<li>${a.lastName}, ${a.firstName}</li>`).join('')
    : '<li>No attendees selected.</li>';

  document.getElementById('edit-btn').addEventListener('click', () => {
    window.location.href = `meetings.html?id=${meetingId}`;
  });
}

// --- Modal ---
const overlay = document.getElementById('modal-overlay');
function showModal(message) {
  return new Promise((resolve) => {
    document.getElementById('modal-message').textContent = message;
    overlay.classList.remove('hidden');
    document.getElementById('modal-yes').onclick = () => { overlay.classList.add('hidden'); resolve(true); };
    document.getElementById('modal-no').onclick = () => { overlay.classList.add('hidden'); resolve(false); };
  });
}

async function downloadPDF() {
  const res = await fetch(`/api/meetings/${meetingId}/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agenda.pdf`;
  a.click();
}

async function sendEmail() {
  const res = await fetch(`/api/meetings/${meetingId}/email`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) { alert(data.error); return; }
  if (data.skipped?.length) {
    alert(`Emails sent.\n\nThe following attendees have no email on file and were skipped:\n• ${data.skipped.join('\n• ')}`);
  }
}

document.getElementById('generate-pdf-btn').addEventListener('click', async () => {
  await downloadPDF();
  const alsoEmail = await showModal('Would you also like to email the attendees?');
  if (alsoEmail) await sendEmail();
});

document.getElementById('email-btn').addEventListener('click', async () => {
  await sendEmail();
  const alsoPDF = await showModal('Would you also like to generate a PDF?');
  if (alsoPDF) await downloadPDF();
});

loadAgenda();
