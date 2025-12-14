import { fetchWithAuth } from "../utils/api";

export async function getProfile() {
  return fetchWithAuth("profile/me", { method: "GET" });
}

export async function login({ email, password }) {
  const res = await fetchWithAuth("auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res;
}

export async function register({ fullName, email, password, role }) {
  const res = await fetchWithAuth("auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password, role }),
  });
  return res;
}
