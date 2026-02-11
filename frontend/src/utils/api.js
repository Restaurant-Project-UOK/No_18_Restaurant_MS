import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from "./jwt";

const BASE_URL = import.meta.env.VITE_BASE_URL.endsWith("/")
  ? import.meta.env.VITE_BASE_URL
  : import.meta.env.VITE_BASE_URL + "/";

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const newAccessToken = await res.text(); //  backend returns the token 
    setAccessToken(newAccessToken);
    return true;
  } catch {
    return false;
  }
}

export async function fetchWithAuth(endpoint, options = {}) {
  if (!options.headers) options.headers = {};
  options.headers["Authorization"] = `Bearer ${getAccessToken()}`;

  let res = await fetch(`${BASE_URL}${endpoint}`, options);

  if (res.status === 403) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      clearTokens();
      window.location.href = "/login";
      return;
    }
    options.headers["Authorization"] = `Bearer ${getAccessToken()}`;
    res = await fetch(`${BASE_URL}${endpoint}`, options);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }

  return res.json();
}
