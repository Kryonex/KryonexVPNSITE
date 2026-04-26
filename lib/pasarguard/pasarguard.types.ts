export type PasarGuardMode = "mock" | "production";

export type PasarGuardConfig = {
  mode: PasarGuardMode;
  baseUrl: string;
  token?: string;
  adminUsername?: string;
  adminPassword?: string;
  userTemplateId?: number;
};

export type PasarGuardUserResponse = {
  id?: number | string;
  username: string;
  status?: "active" | "disabled" | "on_hold" | "limited" | "expired";
  expire?: string | number | null;
  data_limit?: number | null;
  subscription_url?: string;
};

export type PasarGuardIssueInput = {
  username: string;
  email: string;
  expiresAt: Date;
  days: number;
  isTrial: boolean;
  note?: string;
};

export type PasarGuardIssueResult = {
  provider: "mock" | "pasarguard";
  username: string;
  providerUserId?: string;
  subscriptionUrl: string;
  raw?: unknown;
};
