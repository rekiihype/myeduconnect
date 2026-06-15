/**
 * MyEduConnect Mobile App — API Configuration
 *
 * IMPORTANT: Update API_BASE to your host machine's IP address.
 * Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
 * Example: if your IP is 192.168.1.5, set API_BASE = 'http://192.168.1.5/api'
 *
 * DELIBERATE: Using HTTP (not HTTPS) — cleartext transmission (V-12)
 */

// UPDATE THIS TO YOUR HOST MACHINE IP
export const API_BASE = 'http://10.33.199.36/api';  // Wi-Fi IP address

export async function apiCall(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
