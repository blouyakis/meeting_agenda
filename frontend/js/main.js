export function getToken() {
  return localStorage.getItem('token');
}

export function requireAuth() {
  if (!getToken()) window.location.href = '/auth.html';
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    alert('Your session has expired. Please log in again.');
    window.location.href = '/auth.html';
    return null;
  }
  return res;
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = '/auth.html';
}

document.getElementById('logout-btn')?.addEventListener('click', logout);

document.addEventListener('click', () => {
  document.querySelectorAll('.action-panel').forEach((p) => p.classList.add('hidden'));
});
