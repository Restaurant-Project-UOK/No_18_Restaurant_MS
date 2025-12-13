const BASE_URL = "http://172.20.10.6:8081/api/profile";

/**
 * Get current user's profile
 * @param {string} token JWT access token
 * @returns {Promise<Object>} Profile data
 */
export async function getProfile(token) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(`${BASE_URL}/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include", // optional, if using cookies
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch profile: ${text}`);
    }

    return res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  }
}

/**
 * Update current user's profile
 * @param {string} token JWT access token
 * @param {Object} profileData
 * @returns {Promise<Object>} Updated profile data
 */
export async function updateProfile(token, profileData) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${BASE_URL}/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include", // optional
      body: JSON.stringify(profileData),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to update profile: ${text}`);
    }

    return res.json();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  }
}
