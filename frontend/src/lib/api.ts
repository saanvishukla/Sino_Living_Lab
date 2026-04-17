export const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:8000";
export { API_BASE as default };

const TOKEN_KEY = "sino_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export interface Building {
  id: string;
  name: string;
  name_zh: string | null;
  code: string;
  address: string | null;
  address_zh: string | null;
  template_key: string;
  brand_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  building_id: string;
  name: string;
  name_zh: string | null;
  category_zh: string | null;
  unit: string | null;
  floor: string | null;
  category: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: "active" | "pending" | "left";
  created_at: string;
  updated_at: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (res.status === 401) {
    setToken(null);
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

export interface Poster {
  id: string;
  building_id: string;
  template_key: string;
  version: number;
  status: "draft" | "pending_approval" | "approved" | "rejected" | "live";
  is_live: boolean;
  image_path: string | null;
  pdf_path: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export const api = {
  buildings: () => fetchJson<Building[]>("/api/buildings/"),
  tenants: (buildingId?: string) =>
    fetchJson<Tenant[]>(
      `/api/tenants/${buildingId ? `?building_id=${buildingId}` : ""}`
    ),
  updateTenant: async (
    id: string,
    patch: Partial<
      Pick<
        Tenant,
        "name" | "name_zh" | "unit" | "floor" | "category" | "category_zh" | "status"
      >
    >
  ): Promise<Tenant> => {
    const res = await fetch(`${API_BASE}/api/tenants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  activity: (limit = 100) => fetchJson<Activity[]>(`/api/activity/?limit=${limit}`),
  posters: () => fetchJson<Poster[]>("/api/posters/"),
  generatePoster: async (buildingId: string): Promise<Poster> => {
    const res = await fetch(`${API_BASE}/api/posters/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ building_id: buildingId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  posterImageUrl: (posterId: string) => `${API_BASE}/api/posters/${posterId}/image`,
  approvePoster: async (posterId: string): Promise<Poster> => {
    const res = await fetch(`${API_BASE}/api/posters/${posterId}/approve`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  rejectPoster: async (posterId: string): Promise<Poster> => {
    const res = await fetch(`${API_BASE}/api/posters/${posterId}/reject`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  uploadCsv: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/plugin/import/csv`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  syncTenants: async (payload: unknown) => {
    const res = await fetch(`${API_BASE}/api/plugin/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Auth
  signup: async (email: string, name: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Signup failed");
    return res.json() as Promise<{ token: string; user: AuthUser }>;
  },
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Login failed");
    return res.json() as Promise<{ token: string; user: AuthUser }>;
  },
  me: () => fetchJson<AuthUser>("/api/auth/me"),

  // Insights / Overview
  suggestions: () =>
    fetchJson<{
      generated_at: string;
      count: number;
      suggestions: {
        severity: "high" | "medium" | "low";
        kind: string;
        title: string;
        body: string;
        cta?: { label: string; href: string };
      }[];
    }>("/api/insights/suggestions"),
  summary: () =>
    fetchJson<{
      totals: {
        buildings: number;
        tenants: number;
        active_tenants: number;
        posters: number;
        live_posters: number;
        pending_posters: number;
      };
      by_category: { category: string; count: number }[];
      by_building: { building_id: string; building: string; count: number }[];
      by_status: { status: string; count: number }[];
      activity_by_day: { date: string; count: number }[];
    }>("/api/insights/summary"),
  notifications: () =>
    fetchJson<{
      count: number;
      notifications: {
        channel: string;
        to: string;
        subject: string;
        body: string;
        sent_at: string;
        template?: string;
      }[];
    }>("/api/insights/notifications"),
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
