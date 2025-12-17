import { fetchWithAuth } from "../utils/api";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: number;
}

export async function getProfile(): Promise<any> {
  return fetchWithAuth("profile/me", { method: "GET" });
}

export async function updateProfile(payload: Partial<RegisterPayload>): Promise<any> {
  return fetchWithAuth("profile/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload): Promise<any> {
  const res = await fetchWithAuth("auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res;
}

export async function register(payload: RegisterPayload): Promise<any> {
  const res = await fetchWithAuth("auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res;
}
