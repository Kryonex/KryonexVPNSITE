import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { safeError } from "@/lib/crypto";
import { PasarGuardClient } from "@/lib/pasarguard/PasarGuardClient";
import type { PasarGuardConfig, PasarGuardIssueInput, PasarGuardIssueResult } from "@/lib/pasarguard/pasarguard.types";

function usernameFromEmail(email: string) {
  const local = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 18) || "user";
  const hash = crypto.createHash("sha1").update(email).digest("hex").slice(0, 8);
  return `zv_${local}_${hash}`.slice(0, 32);
}

export class PasarGuardService {
  static async fromSettings() {
    const settings = await getSettings([
      "pasarguard_mode",
      "pasarguard_base_url",
      "pasarguard_token",
      "pasarguard_admin_username",
      "pasarguard_admin_password",
      "pasarguard_user_template_id"
    ]);
    const config: PasarGuardConfig = {
      mode: settings.pasarguard_mode === "production" ? "production" : "mock",
      baseUrl: settings.pasarguard_base_url,
      token: settings.pasarguard_token,
      adminUsername: settings.pasarguard_admin_username,
      adminPassword: settings.pasarguard_admin_password,
      userTemplateId: settings.pasarguard_user_template_id ? Number(settings.pasarguard_user_template_id) : undefined
    };
    return new PasarGuardService(config);
  }

  constructor(private readonly config: PasarGuardConfig) {}

  private client() {
    if (!this.config.baseUrl) throw new Error("PasarGuard base URL is not configured");
    return new PasarGuardClient(this.config);
  }

  async checkConnection() {
    if (this.config.mode === "mock") return { ok: true, mode: "mock" };
    await this.client().health();
    return { ok: true, mode: "production" };
  }

  async createOrExtendSubscription(input: PasarGuardIssueInput): Promise<PasarGuardIssueResult> {
    const username = input.username || usernameFromEmail(input.email);
    if (this.config.mode === "mock") {
      const token = crypto.randomBytes(18).toString("base64url");
      const subscriptionUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://example.com"}/sub/${token}`;
      await prisma.integrationLog.create({
        data: { type: "pasarguard", level: "info", message: "Mock PasarGuard issue", meta: { username, days: input.days } }
      });
      return { provider: "mock", username, subscriptionUrl };
    }

    if (!this.config.userTemplateId) throw new Error("PasarGuard user template id is not configured");
    const client = this.client();
    const note = input.note || `ZEROVPN ${input.isTrial ? "trial" : "paid"} until ${input.expiresAt.toISOString()}`;

    try {
      let response;
      try {
        response = await client.createUserFromTemplate(username, this.config.userTemplateId, note);
      } catch (error) {
        const message = safeError(error);
        if (!message.includes("409") && !message.toLowerCase().includes("exist")) throw error;
        response = await client.applyTemplate(username, this.config.userTemplateId, note);
      }

      response = await client.updateUser(username, {
        status: "active",
        expire: input.expiresAt.toISOString(),
        data_limit: 0,
        note
      });

      const subscriptionUrl = response.subscription_url || (await client.getUser(username)).subscription_url;
      if (!subscriptionUrl) throw new Error("PasarGuard did not return subscription_url");

      await prisma.integrationLog.create({
        data: { type: "pasarguard", level: "info", message: "PasarGuard subscription issued", meta: { username } }
      });
      return {
        provider: "pasarguard",
        username,
        providerUserId: response.id ? String(response.id) : undefined,
        subscriptionUrl,
        raw: response
      };
    } catch (error) {
      await prisma.integrationLog.create({
        data: { type: "pasarguard", level: "error", message: "PasarGuard issue failed", meta: { username, error: safeError(error) } }
      });
      throw error;
    }
  }

  async disableSubscription(username: string) {
    if (this.config.mode === "mock") return true;
    await this.client().disableUser(username);
    return true;
  }

  async syncStatus(username: string) {
    if (this.config.mode === "mock") return null;
    return this.client().getUser(username);
  }
}
