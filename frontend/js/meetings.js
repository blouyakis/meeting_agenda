import { requireAuth, getToken } from './main.js';
requireAuth();

// --- Action Items ---
const DEFAULT_ACTION_ITEMS = [
  'Complete tasks',
  'Obtain approval',
  'Review deliverables',
  'Update timeline',
  'Submit documents',
  'Finalize',
  'Follow up',
  'Select Vendor/Tool',
  'Outstanding issues',
];
let allActionItems = [...DEFAULT_ACTION_ITEMS];

async function loadActionItems() {
  const res = await fetch('/api/action-items', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const custom = await res.json();
  custom.forEach((label) => {
    if (!allActionItems.includes(label)) allActionItems.push(label);
  });
}

function buildActionPanel(container, selected = []) {
  const panel = container.querySelector('.action-panel');
  panel.innerHTML = allActionItems.map((item) => `
    <label class="action-checkbox-label">
      <input type="checkbox" value="${item}" ${selected.includes(item) ? 'checked' : ''} />
      ${item}
    </label>
  `).join('') + `<button type="button" class="btn btn-primary btn-add-action-item">+ Add to list...</button>`;

  panel.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => updateActionTrigger(container));
  });

  panel.querySelector('.btn-add-action-item').addEventListener('click', async () => {
    const label = prompt('Enter a new action item to add to your list:');
    if (!label?.trim()) return;
    const res = await fetch('/api/action-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ label: label.trim() }),
    });
    if (res.ok || res.status === 409) {
      if (!allActionItems.includes(label.trim())) allActionItems.push(label.trim());
      refreshAllActionPanels();
    }
  });
}

function updateActionTrigger(container) {
  const checked = [...container.querySelectorAll('.action-panel input:checked')].map((cb) => cb.value);
  const trigger = container.querySelector('.action-trigger');
  trigger.textContent = checked.length === 0 ? 'Select action items...' : checked.join(', ');
}

function refreshAllActionPanels() {
  document.querySelectorAll('.action-dropdown').forEach((container) => {
    const checked = [...container.querySelectorAll('.action-panel input:checked')].map((cb) => cb.value);
    buildActionPanel(container, checked);
    updateActionTrigger(container);
  });
}

function createActionDropdown(selected = []) {
  const wrapper = document.createElement('div');
  wrapper.className = 'action-dropdown';
  wrapper.innerHTML = `
    <button type="button" class="action-trigger">Select action items...</button>
    <div class="action-panel hidden"></div>
  `;
  const trigger = wrapper.querySelector('.action-trigger');
  const panel = wrapper.querySelector('.action-panel');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !panel.classList.contains('hidden');
    document.querySelectorAll('.action-panel').forEach((p) => p.classList.add('hidden'));
    if (!isOpen) panel.classList.remove('hidden');
  });

  buildActionPanel(wrapper, selected);
  updateActionTrigger(wrapper);
  return wrapper;
}

// --- Topics ---
let topicCount = 0;
function addTopic(text = '', priority = 3, notes = '', actionItems = []) {
  topicCount++;
  const div = document.createElement('div');
  div.className = 'topic-row';
  div.dataset.index = topicCount;
  div.innerHTML = `
    <div class="topic-row-top">
      <input type="text" class="topic-text" placeholder="Topic" value="${text}" required />
      <select class="topic-priority">
        ${[1,2,3,4,5].map((n) => `<option value="${n}" ${n === priority ? 'selected' : ''}>Priority ${n}</option>`).join('')}
      </select>
      <button type="button" class="btn btn-secondary btn-remove-topic">✕</button>
    </div>
    <div class="topic-row-bottom">
      <textarea class="topic-notes" placeholder="Notes (optional)">${notes}</textarea>
    </div>
  `;
  div.querySelector('.btn-remove-topic').addEventListener('click', () => div.remove());
  const selected = Array.isArray(actionItems) ? actionItems : (actionItems ? [actionItems] : []);
  div.querySelector('.topic-row-bottom').appendChild(createActionDropdown(selected));
  document.getElementById('topics-list').appendChild(div);
}
document.getElementById('add-topic-btn').addEventListener('click', () => addTopic());

// --- Employees ---
async function loadEmployeeChecklist(selectedIds = []) {
  const res = await fetch('/api/employees', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const employees = await res.json();
  const list = document.getElementById('employee-checklist');
  const grouped = employees.reduce((acc, e) => {
    const dept = e.department || 'No Department';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(e);
    return acc;
  }, {});
  list.innerHTML = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dept, emps]) => `
    <li class="checklist-dept-header">${dept}</li>
    ${emps.map((e) => `
      <li>
        <label>
          <input type="checkbox" value="${e._id}" ${selectedIds.includes(e._id) ? 'checked' : ''} />
          ${e.lastName}, ${e.firstName}
        </label>
      </li>
    `).join('')}
  `).join('');
}

// --- Load existing meeting if ?id= is in the URL ---
const meetingId = new URLSearchParams(window.location.search).get('id');

async function init() {
  await loadActionItems();
  if (meetingId) {
    const res = await fetch(`/api/meetings/${meetingId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const meeting = await res.json();
    document.getElementById('meeting-title').value = meeting.title;
    document.getElementById('meeting-location').value = meeting.location;
    document.getElementById('meeting-start').value = meeting.startTime.slice(0, 16);
    document.getElementById('meeting-end').value = meeting.endTime.slice(0, 16);
    document.getElementById('topics-list').innerHTML = '';
    meeting.topics.forEach((t) => addTopic(t.text, t.priority, t.notes, t.actionItems || []));
    await loadEmployeeChecklist(meeting.attendeeIds);
  } else {
    addTopic();
    await loadEmployeeChecklist();
  }
}
init();

// --- Time validation ---
const startInput = document.getElementById('meeting-start');
const endInput = document.getElementById('meeting-end');

startInput.addEventListener('change', () => {
  if (!startInput.value) endInput.value = '';
});

endInput.addEventListener('focus', () => {
  if (!startInput.value) {
    alert('Please enter a start time first.');
    endInput.blur();
  }
});

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

function getFormData() {
  const topics = [...document.querySelectorAll('.topic-row')].map((row) => ({
    text: row.querySelector('.topic-text').value,
    priority: Number(row.querySelector('.topic-priority').value),
    notes: row.querySelector('.topic-notes').value,
    actionItems: [...row.querySelectorAll('.action-panel input:checked')].map((cb) => cb.value),
  }));
  const attendeeIds = [...document.querySelectorAll('#employee-checklist input:checked')].map((cb) => cb.value);
  return {
    title: document.getElementById('meeting-title').value,
    location: document.getElementById('meeting-location').value,
    startTime: document.getElementById('meeting-start').value,
    endTime: document.getElementById('meeting-end').value,
    topics,
    attendeeIds,
  };
}

async function saveMeeting() {
  const data = getFormData();
  if (!data.title.trim()) { alert('Please enter a meeting title.'); return null; }
  if (meetingId) {
    const res = await fetch(`/api/meetings/${meetingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data),
    });
    return res.json();
  }
  const res = await fetch('/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  return res.json();
}

document.getElementById('cancel-btn').addEventListener('click', () => {
  window.location.href = '/dashboard.html';
});

document.getElementById('save-btn').addEventListener('click', async () => {
  const meeting = await saveMeeting();
  if (!meeting) return;
  window.location.href = '/dashboard.html';
});

document.getElementById('generate-pdf-btn').addEventListener('click', async () => {
  const meeting = await saveMeeting();
  if (!meeting) return;
  const res = await fetch(`/api/meetings/${meeting._id}/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${meeting.title || 'agenda'}.pdf`;
  a.click();
  const alsoEmail = await showModal('Would you also like to email the attendees?');
  if (alsoEmail) await emailMeeting(meeting._id);
  window.location.href = '/dashboard.html';
});

document.getElementById('email-btn').addEventListener('click', async () => {
  const meeting = await saveMeeting();
  if (!meeting) return;
  await emailMeeting(meeting._id);
  const alsoPDF = await showModal('Would you also like to generate a PDF?');
  if (alsoPDF) {
    const res = await fetch(`/api/meetings/${meeting._id}/pdf`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title || 'agenda'}.pdf`;
    a.click();
  }
  window.location.href = '/dashboard.html';
});

async function emailMeeting(id) {
  const res = await fetch(`/api/meetings/${id}/email`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) { alert(data.error); return; }
  if (data.skipped?.length) {
    alert(`Emails sent.\n\nThe following attendees have no email on file and were skipped:\n• ${data.skipped.join('\n• ')}`);
  }
}
