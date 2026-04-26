import { safeError } from "@/lib/crypto";
import type { PasarGuardConfig, PasarGuardUserResponse } from "@/lib/pasarguard/pasarguard.types";

export class PasarGuardClient {
  private token?: string;

  constructor(private readonly config: PasarGuardConfig) {
    this.token = config.token;
  }

  private url(path: string) {
    const base = this.config.baseUrl.replace(/\/+$/, "");
    return `${base}${path}`;
  }

  async login() {
    if (this.token) return this.token;
    if (!this.config.adminUsername || !this.config.adminPassword) {
      throw new Error("PasarGuard credentials are missing");
    }
    const body = new URLSearchParams();
    body.set("username", this.config.adminUsername);
    body.set("password", this.config.adminPassword);
    const response = await fetch(this.url("/api/admin/token"), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body
    });
    if (!response.ok) throw new Error(`PasarGuard auth failed: ${response.status}`);
    const data = (await response.json()) as { access_token: string };
    this.token = data.access_token;
    return this.token;
  }

  async request<T>(path: string, init: RequestInit = {}) {
    const token = await this.login();
    const response = await fetch(this.url(path), {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        ...(init.headers || {})
      }
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(`PasarGuard ${path} failed: ${response.status} ${safeError(text)}`);
    }
    return data as T;
  }

  async health() {
    await this.request("/api/admin");
    return true;
  }

  async createUserFromTemplate(username: string, templateId: number, note: string) {
    return this.request<PasarGuardUserResponse>("/api/user/from_template", {
      method: "POST",
      body: JSON.stringify({ username, user_template_id: templateId, note })
    });
  }

  async applyTemplate(username: string, templateId: number, note: string) {
    return this.request<PasarGuardUserResponse>(`/api/user/from_template/${encodeURIComponent(username)}`, {
      method: "PUT",
      body: JSON.stringify({ user_template_id: templateId, note })
    });
  }

  async updateUser(username: string, data: Record<string, unknown>) {
    return this.request<PasarGuardUserResponse>(`/api/user/${encodeURIComponent(username)}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  async getUser(username: string) {
    return this.request<PasarGuardUserResponse>(`/api/user/${encodeURIComponent(username)}`);
  }

  async disableUser(username: string) {
    return this.updateUser(username, { status: "disabled" });
  }
}
