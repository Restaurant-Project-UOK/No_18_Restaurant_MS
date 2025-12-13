// src/api/auth.js

const BASE_URL = "http://172.20.10.6:8081/api/auth"; // matches @RequestMapping("/api/auth")

// Register (ignore response)
export async function register({ fullName, email, password, role = 1 }) {
  await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { 
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ fullName, email, password, role, provider: 1 }),
  });

}

// Login (email + password)
export async function login({ email, password }) {
    const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

// Google OAuth login
export async function googleLogin({ email, token }) {
  await fetch(`${BASE_URL}/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token }),
  });

}
