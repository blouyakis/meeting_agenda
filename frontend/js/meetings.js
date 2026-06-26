import { requireAuth, getToken } from "./main.js";
requireAuth();

const DEFAULT_ACTION_ITEMS = [
  "Complete tasks",
  "Obtain approval",
  "Review deliverables",
  "Update timeline",
  "Submit documents",
  "Finalize",
  "Follow up",
  "Select Vendor/Tool",
  "Outstanding issues",
];
let allActionItems = [...DEFAULT_ACTION_ITEMS];

async function loadActionItems() {
  const res = await fetch("/api/action-items", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const custom = await res.json();
  custom.forEach((label) => {
    if (!allActionItems.includes(label)) allActionItems.push(label);
  });
}

function buildActionPanel(panel, selected = []) {
  panel.innerHTML =
    allActionItems
      .map(
        (item) => `
    <label class="action-checkbox-label">
      <input type="checkbox" value="${item}" ${selected.includes(item) ? "checked" : ""} />
      ${item}
    </label>
  `,
      )
      .join("") +
    `<button type="button" class="btn btn-primary btn-add-action-item">+ Add to list...</button>`;

  panel
    .querySelector(".btn-add-action-item")
    .addEventListener("click", async () => {
      const label = prompt("Enter a new action item to add to your list:");
      if (!label?.trim()) return;
      const res = await fetch("/api/action-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ label: label.trim() }),
      });
      if (res.ok || res.status === 409) {
        if (!allActionItems.includes(label.trim()))
          allActionItems.push(label.trim());
        refreshAllActionPanels();
      }
    });
}

function updateActionTrigger(wrapper) {
  const panel =
    wrapper.querySelector(".action-panel") ||
    [...document.querySelectorAll(".action-panel")].find(
      (p) => p._wrapper === wrapper,
    );
  const checked = panel
    ? [...panel.querySelectorAll("input:checked")].map((cb) => cb.value)
    : [];
  const trigger = wrapper.querySelector(".action-trigger");
  trigger.textContent =
    checked.length === 0 ? "Select action items..." : checked.join(", ");
}

function refreshAllActionPanels() {
  document.querySelectorAll(".action-dropdown").forEach((wrapper) => {
    const panel = wrapper.querySelector(".action-panel");
    const checked = [...panel.querySelectorAll("input:checked")].map(
      (cb) => cb.value,
    );
    buildActionPanel(panel, checked);
    updateActionTrigger(wrapper);
  });
}

function createActionDropdown(selected = []) {
  const wrapper = document.createElement("div");
  wrapper.className = "action-dropdown";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "action-trigger";
  trigger.textContent = "Select action items...";

  const panel = document.createElement("div");
  panel.className = "action-panel hidden";
  panel._wrapper = wrapper;

  wrapper.appendChild(trigger);
  wrapper.appendChild(panel);

  buildActionPanel(panel, selected);

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !panel.classList.contains("hidden");

    document.querySelectorAll(".action-panel").forEach((p) => {
      p.classList.add("hidden");
    });

    if (!isOpen) {
      const rect = trigger.getBoundingClientRect();
      const panelWidth = 300;
      const leftPos = rect.right - panelWidth;
      panel.style.position = "fixed";
      panel.style.top = `${rect.bottom + 4}px`;
      panel.style.left = `${Math.max(8, leftPos)}px`;
      panel.style.width = `${panelWidth}px`;
      panel.style.zIndex = "9999";
      document.body.appendChild(panel);
      panel.classList.remove("hidden");
    }
  });

  panel.addEventListener("change", () => updateActionTrigger(wrapper));

  panel.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.addEventListener("click", () => {
    if (!panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
      wrapper.appendChild(panel);
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      document.querySelectorAll(".action-panel").forEach((p) => {
        if (p.parentElement === document.body) {
          p.classList.add("hidden");
          document.body.removeChild(p);
          wrapper.appendChild(p);
        }
      });
    },
    { passive: true },
  );

  return wrapper;
}

function syncPriorityDropdowns() {
  const rows = [...document.querySelectorAll(".topic-row")];
  const N = rows.length;
  rows.forEach((row) => {
    const select = row.querySelector(".topic-priority");
    const current = Number(select.value);
    select.innerHTML = Array.from({ length: N }, (_, i) => {
      const val = i + 1;
      return `<option value="${val}">Priority ${val}</option>`;
    }).join("");
    select.value = current;
  });
  validatePriority();
}

function validatePriority() {
  const rows = [...document.querySelectorAll(".topic-row")];
  const values = rows.map((r) =>
    Number(r.querySelector(".topic-priority").value),
  );
  const hasDuplicates = values.length !== new Set(values).size;

  let warning = document.getElementById("priority-warning");
  if (!warning) {
    warning = document.createElement("p");
    warning.id = "priority-warning";
    warning.style.cssText =
      "color:#dc2626;font-size:0.85rem;margin-top:0.25rem;";
    document.getElementById("topics-list").after(warning);
  }

  const generateBtn = document.getElementById("generate-pdf-btn");
  const emailBtn = document.getElementById("email-btn");
  const saveBtn = document.getElementById("save-btn");
  if (hasDuplicates) {
    warning.textContent =
      "Each topic must have a unique priority before generating.";
    generateBtn.disabled = true;
    emailBtn.disabled = true;
    saveBtn.disabled = true;
    generateBtn.style.opacity = "0.5";
    emailBtn.style.opacity = "0.5";
    saveBtn.style.opacity = "0.5";
  } else {
    warning.textContent = "";
    generateBtn.disabled = false;
    emailBtn.disabled = false;
    saveBtn.disabled = false;
    generateBtn.style.opacity = "1";
    emailBtn.style.opacity = "1";
    saveBtn.style.opacity = "1";
  }
}

let topicCount = 0;
let suppressSync = false;

function addTopic(text = "", priority = null, notes = "", actionItems = []) {
  topicCount++;
  const div = document.createElement("div");
  div.className = "topic-row";
  div.dataset.index = topicCount;

  const assignedPriority = Number(
    priority ?? document.querySelectorAll(".topic-row").length + 1,
  );
  const N = Math.max(
    document.querySelectorAll(".topic-row").length + 1,
    assignedPriority,
  );

  const priorityOptions = Array.from({ length: N }, (_, i) => {
    const val = i + 1;
    return `<option value="${val}" ${val === assignedPriority ? "selected" : ""}>Priority ${val}</option>`;
  }).join("");

  div.innerHTML = `
    <div class="topic-row-top">
      <input type="text" class="topic-text" placeholder="Topic" value="${text}" required />
      <select class="topic-priority">${priorityOptions}</select>
      <button type="button" class="btn btn-secondary btn-remove-topic">✕</button>
    </div>
    <div class="topic-row-bottom">
      <textarea class="topic-notes" placeholder="Notes (optional)">${notes}</textarea>
    </div>
  `;

  div.querySelector(".btn-remove-topic").addEventListener("click", () => {
    div.remove();
    reassignRanksAfterRemove();
    syncPriorityDropdowns();
    setTimeout(updatePreview, 50);
  });

  div.querySelector(".topic-priority").addEventListener("change", () => {
    syncPriorityDropdowns();
    setTimeout(updatePreview, 50);
  });

  const selected = Array.isArray(actionItems)
    ? actionItems
    : actionItems
      ? [actionItems]
      : [];
  div
    .querySelector(".topic-row-bottom")
    .appendChild(createActionDropdown(selected));
  document.getElementById("topics-list").appendChild(div);

  if (!suppressSync) {
    syncPriorityDropdowns();
    setTimeout(updatePreview, 50);
  }
}

function reassignRanksAfterRemove() {
  const rows = [...document.querySelectorAll(".topic-row")];
  const N = rows.length;
  const used = new Set(
    rows.map((r) => Number(r.querySelector(".topic-priority").value)),
  );
  let nextAvailable = 1;
  rows.forEach((row) => {
    const select = row.querySelector(".topic-priority");
    const val = Number(select.value);
    if (val > N) {
      while (used.has(nextAvailable)) nextAvailable++;
      select.value = nextAvailable;
      used.add(nextAvailable);
    }
  });
}

document
  .getElementById("add-topic-btn")
  .addEventListener("click", () => addTopic());

async function loadEmployeeChecklist(selectedIds = []) {
  const res = await fetch("/api/employees", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const employees = await res.json();
  const list = document.getElementById("employee-checklist");
  const grouped = employees.reduce((acc, e) => {
    const dept = e.department || "No Department";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(e);
    return acc;
  }, {});
  list.innerHTML = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([dept, emps]) => `
    <li class="checklist-dept-header">${dept}</li>
    ${emps
      .map(
        (e) => `
      <li>
        <label>
          <input type="checkbox" value="${e._id}" ${selectedIds.includes(e._id) ? "checked" : ""} />
          ${e.lastName}, ${e.firstName}
        </label>
      </li>
    `,
      )
      .join("")}
  `,
    )
    .join("");
}

const meetingId = new URLSearchParams(window.location.search).get("id");

async function init() {
  await loadActionItems();
  if (meetingId) {
    const res = await fetch(`/api/meetings/${meetingId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const meeting = await res.json();
    document.getElementById("meeting-title").value = meeting.title;
    document.getElementById("meeting-location").value = meeting.location;
    document.getElementById("meeting-start").value = meeting.startTime.slice(
      0,
      16,
    );
    document.getElementById("meeting-end").value = meeting.endTime.slice(0, 16);
    if (meeting.steepness !== undefined) {
      document.getElementById("steepness-slider").value = meeting.steepness;
    }
    document.getElementById("topics-list").innerHTML = "";
    suppressSync = true;
    meeting.topics.forEach((t) =>
      addTopic(t.text, t.priority, t.notes, t.actionItems || []),
    );
    suppressSync = false;
    syncPriorityDropdowns();
    await loadEmployeeChecklist(meeting.attendeeIds);
  } else {
    addTopic();
    await loadEmployeeChecklist();
  }
  setTimeout(updatePreview, 100);
}
init();

const startInput = document.getElementById("meeting-start");
const endInput = document.getElementById("meeting-end");

startInput.addEventListener("change", () => {
  if (!startInput.value) endInput.value = "";
});

endInput.addEventListener("focus", () => {
  if (!startInput.value) {
    alert("Please enter a start time first.");
    endInput.blur();
  }
});

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

function getFormData() {
  const topics = [...document.querySelectorAll(".topic-row")].map((row) => {
    const dropdown = row.querySelector(".action-dropdown");
    const panel =
      dropdown.querySelector(".action-panel") ||
      [...document.querySelectorAll(".action-panel")].find(
        (p) => p._wrapper === dropdown,
      );
    const actionItems = panel
      ? [...panel.querySelectorAll("input:checked")].map((cb) => cb.value)
      : [];
    return {
      text: row.querySelector(".topic-text").value,
      priority: Number(row.querySelector(".topic-priority").value),
      notes: row.querySelector(".topic-notes").value,
      actionItems,
    };
  });
  const attendeeIds = [
    ...document.querySelectorAll("#employee-checklist input:checked"),
  ].map((cb) => cb.value);
  return {
    title: document.getElementById("meeting-title").value,
    location: document.getElementById("meeting-location").value,
    startTime: document.getElementById("meeting-start").value,
    endTime: document.getElementById("meeting-end").value,
    topics,
    attendeeIds,
    steepness: parseFloat(
      document.getElementById("steepness-slider").value ?? 0.5,
    ),
  };
}

async function saveMeeting() {
  const data = getFormData();
  if (!data.title.trim()) {
    alert("Please enter a meeting title.");
    return null;
  }
  if (meetingId) {
    const res = await fetch(`/api/meetings/${meetingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  }
  const res = await fetch("/api/meetings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

document.getElementById("cancel-btn").addEventListener("click", () => {
  window.location.href = "/dashboard.html";
});

document.getElementById("save-btn").addEventListener("click", async () => {
  const meeting = await saveMeeting();
  if (!meeting) return;
  window.location.href = "/dashboard.html";
});

document
  .getElementById("generate-pdf-btn")
  .addEventListener("click", async () => {
    const meeting = await saveMeeting();
    if (!meeting) return;
    const res = await fetch(`/api/meetings/${meeting._id}/pdf`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meeting.title || "agenda"}.pdf`;
    a.click();
    const alsoEmail = await showModal(
      "Would you also like to email the attendees?",
    );
    if (alsoEmail) await emailMeeting(meeting._id);
    window.location.href = "/dashboard.html";
  });

document.getElementById("email-btn").addEventListener("click", async () => {
  const meeting = await saveMeeting();
  if (!meeting) return;
  await emailMeeting(meeting._id);
  const alsoPDF = await showModal("Would you also like to generate a PDF?");
  if (alsoPDF) {
    const res = await fetch(`/api/meetings/${meeting._id}/pdf`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meeting.title || "agenda"}.pdf`;
    a.click();
  }
  window.location.href = "/dashboard.html";
});

async function emailMeeting(id) {
  const res = await fetch(`/api/meetings/${id}/email`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error);
    return;
  }
  if (data.skipped?.length) {
    alert(
      `Emails sent.\n\nThe following attendees have no email on file and were skipped:\n• ${data.skipped.join("\n• ")}`,
    );
  }
}

const slider = document.getElementById("steepness-slider");
const preview = document.getElementById("steepness-preview");
const pieCanvas = document.getElementById("pie-canvas");
const pieLegend = document.getElementById("pie-legend");
const piePreview = document.getElementById("pie-preview");

const PIE_COLORS = [
  "#7b2d42",
  "#c9956a",
  "#9d3a54",
  "#e8c4a0",
  "#5a1f30",
  "#d4a87a",
  "#b05070",
  "#f0dcc0",
];

function computeAllocations() {
  const startVal = document.getElementById("meeting-start").value;
  const endVal = document.getElementById("meeting-end").value;
  const topicRows = [...document.querySelectorAll(".topic-row")];
  if (!startVal || !endVal || topicRows.length === 0) return null;
  const totalMinutes = Math.round(
    (new Date(endVal) - new Date(startVal)) / 60000,
  );
  if (totalMinutes <= 0) return null;
  const sorted = [...topicRows]
    .filter((r) => r.querySelector(".topic-text").value.trim())
    .sort(
      (a, b) =>
        Number(a.querySelector(".topic-priority").value) -
        Number(b.querySelector(".topic-priority").value),
    );
  if (sorted.length === 0) return null;
  const N = sorted.length;
  const steepness = parseFloat(slider.value);
  const base = 1.0 + steepness * 2.0;
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
  return sorted.map((row, i) => ({
    label: row.querySelector(".topic-text").value || `Topic ${i + 1}`,
    minutes: floored[i],
    total: totalMinutes,
  }));
}

function drawPie(slices) {
  if (!pieCanvas) return;
  const ctx = pieCanvas.getContext("2d");
  ctx.clearRect(0, 0, 240, 240);
  const total = slices.reduce((a, b) => a + b.minutes, 0);
  let start = -Math.PI / 2;
  slices.forEach((s, i) => {
    const angle = (s.minutes / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(60, 60);
    ctx.arc(60, 60, 56, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    start += angle;
  });
}

function drawLegend(slices) {
  if (!pieLegend) return;
  pieLegend.innerHTML = slices
    .map(
      (s, i) => `
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${PIE_COLORS[i % PIE_COLORS.length]};flex-shrink:0;"></span>
      <span>${s.label}: ${s.minutes} min</span>
    </div>
  `,
    )
    .join("");
}

function updatePreview() {
  const slices = computeAllocations();
  if (!slices) {
    if (preview)
      preview.textContent = "Add topics and set times to see preview.";
    if (piePreview) piePreview.style.display = "none";
    return;
  }
  if (preview)
    preview.textContent = slices
      .map((s) => `${s.label}: ${s.minutes} min`)
      .join(", ");
  if (piePreview) piePreview.style.display = "flex";
  drawPie(slices);
  drawLegend(slices);
}

if (slider) {
  slider.addEventListener("input", updatePreview);
  document
    .getElementById("meeting-start")
    .addEventListener("change", updatePreview);
  document
    .getElementById("meeting-end")
    .addEventListener("change", updatePreview);
  document
    .getElementById("add-topic-btn")
    .addEventListener("click", () => setTimeout(updatePreview, 50));
  document
    .querySelectorAll(".topic-text, .topic-priority")
    .forEach((el) => el.addEventListener("change", updatePreview));
}
 
