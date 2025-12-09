// src/api/auth.js

const BASE_URL = "http://localhost:8080/api/auth"; // matches @RequestMapping("/api/auth")

// Register
export async function register({ fullName, email, password, role = 1 }) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password, role }),
  });
  return res.json();
}

// Login (email + password)
export async function login({ email, password }) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// Google OAuth login
export async function googleLogin({ email, token }) {
  const res = await fetch(`${BASE_URL}/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token }),
  });
  return res.json();
}
