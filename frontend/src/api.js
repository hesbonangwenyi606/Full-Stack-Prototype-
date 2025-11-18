const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body.detail || res.statusText;
    throw new Error(msg);
  }
  return res.json();
}

export async function createUser(name, email) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify({ name, email })
  });
}

export async function getBalance(userId) {
  return request(`/balance/${userId}`);
}

export async function getTransactions(userId) {
  return request(`/transactions/${userId}`);
}

export async function deposit(userId, amount, description) {
  return request("/deposit", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, amount, description })
  });
}

export async function transfer(fromUserId, toUserId, amount, description) {
  return request("/transfer", {
    method: "POST",
    body: JSON.stringify({ from_user_id: fromUserId, to_user_id: toUserId, amount, description })
  });
}

export async function withdraw(userId, amount, description) {
  return request("/withdraw", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, amount, description })
  });
}

export async function getSummary() {
  return request("/admin/summary");
}

export async function getActivity(limit = 10) {
  return request(`/admin/activity?limit=${limit}`);
}
