import { requireAuth, getToken } from "./main.js";
requireAuth();

let editingId = null;

async function loadEmployees() {
  const res = await fetch("/api/employees", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const employees = await res.json();
  const tbody = document.getElementById("employees-tbody");
  tbody.innerHTML = employees
    .map(
      (e) => `
    <tr data-id="${e._id}" data-first="${e.firstName}" data-last="${e.lastName}" data-dept="${e.department || ""}" data-email="${e.email}" data-phone="${e.phone}">
      <td>${e.lastName}, ${e.firstName}</td>
      <td>${e.department || "—"}</td>
      <td>${e.email}</td>
      <td>${e.phone}</td>
      <td>
        <button class="btn-edit" data-id="${e._id}">Edit</button>
        <button class="btn-delete" data-id="${e._id}">Delete</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

document.getElementById("add-employee-btn").addEventListener("click", () => {
  editingId = null;
  document.getElementById("employee-modal-title").textContent = "Add Employee";
  ["emp-first", "emp-last", "emp-department", "emp-email", "emp-phone"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("employee-modal").classList.remove("hidden");
});

document.getElementById("emp-cancel-btn").addEventListener("click", () => {
  document.getElementById("employee-modal").classList.add("hidden");
});

document.getElementById("emp-save-btn").addEventListener("click", async () => {
  const body = {
    firstName: document.getElementById("emp-first").value,
    lastName: document.getElementById("emp-last").value,
    department: document.getElementById("emp-department").value,
    email: document.getElementById("emp-email").value,
    phone: document.getElementById("emp-phone").value,
  };
  const url = editingId ? `/api/employees/${editingId}` : "/api/employees";
  const method = editingId ? "PUT" : "POST";
  await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  document.getElementById("employee-modal").classList.add("hidden");
  loadEmployees();
});

document
  .getElementById("employees-tbody")
  .addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains("btn-delete")) {
      await fetch(`/api/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      loadEmployees();
    }
    if (e.target.classList.contains("btn-edit")) {
      const row = e.target.closest("tr");
      editingId = id;
      document.getElementById("employee-modal-title").textContent =
        "Edit Employee";
      document.getElementById("emp-first").value = row.dataset.first;
      document.getElementById("emp-last").value = row.dataset.last;
      document.getElementById("emp-department").value = row.dataset.dept;
      document.getElementById("emp-email").value = row.dataset.email;
      document.getElementById("emp-phone").value = row.dataset.phone;
      document.getElementById("employee-modal").classList.remove("hidden");
    }
  });

loadEmployees();
