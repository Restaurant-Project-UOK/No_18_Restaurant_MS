import { fetchWithAuth } from "../utils/api";

interface LoginPayload {
  email: string;
  password: string;
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


// frontend/src/api/auth.ts
interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: number;     // 1=CUSTOMER, 2=ADMIN, 3=KITCHEN
  provider?: number; // 1=LOCAL, 2=GOOGLE (optional, defaults to 1 in backend)
  phone?: string;    // Added to match DTO
}