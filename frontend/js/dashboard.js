import { requireAuth, getToken } from "./main.js";
requireAuth();

async function loadMeetings() {
  const res = await fetch("/api/meetings", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const meetings = await res.json();
  const list = document.getElementById("meetings-list");
  if (!meetings.length) return;
  list.innerHTML = meetings
    .map(
      (m) => `
    <li>
      <a href="agenda.html?id=${m._id}">${m.title}</a>
      <span class="meeting-date">${m.startTime ? m.startTime.slice(0, 10) : ""}</span>
      <button class="btn btn-delete-meeting" data-id="${m._id}">Delete</button>
    </li>
  `,
    )
    .join("");

  list.querySelectorAll(".btn-delete-meeting").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this meeting?")) return;
      await fetch(`/api/meetings/${btn.dataset.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      loadMeetings();
    });
  });
}

loadMeetings();
