"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession, destroySession, requireAdmin, requireUser } from "@/lib/session";
import { assertEmailCodeRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/mailer";
import { codeSchema, emailSchema, orderSchema, setupSchema, ticketSchema } from "@/lib/validators";
import { ManualTransferProvider } from "@/lib/payments/ManualTransferProvider";
import { activateTrial, confirmManualOrder, issueSubscriptionForOrder } from "@/lib/orders";
import { getSetting, setSetting } from "@/lib/settings";
import { PasarGuardService } from "@/lib/pasarguard/PasarGuardService";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) || "");
}

export async function sendLoginCode(_: unknown, formData: FormData) {
  const email = emailSchema.parse(formValue(formData, "email"));
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0] || headerStore.get("x-real-ip") || undefined;
  await assertEmailCodeRateLimit(email, ip);
  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = await bcrypt.hash(code, 10);
  const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email } });
  await prisma.emailLoginCode.create({
    data: {
      email,
      codeHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      ip,
      userAgent: headerStore.get("user-agent") || undefined
    }
  });
  await sendEmail(email, "Код входа ZEROVPN", `Ваш код входа: ${code}. Он действует 10 минут.`, user.id);
  return { ok: true, email, message: "Код отправлен. Если SMTP выключен, код записан в EmailLog." };
}

export async function verifyLoginCode(_: unknown, formData: FormData) {
  const email = emailSchema.parse(formValue(formData, "email"));
  const code = codeSchema.parse(formValue(formData, "code"));
  const login = await prisma.emailLoginCode.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    include: { user: true }
  });
  if (!login || login.attempts >= 5) return { ok: false, email, message: "Код неверный или истёк." };
  const valid = await bcrypt.compare(code, login.codeHash);
  if (!valid) {
    await prisma.emailLoginCode.update({ where: { id: login.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, email, message: "Код неверный." };
  }
  await prisma.emailLoginCode.update({ where: { id: login.id }, data: { consumedAt: new Date() } });
  await createSession(login.userId!, login.user!.role);
  redirect("/account");
}

export async function adminLogin(_: unknown, formData: FormData) {
  const email = emailSchema.parse(formValue(formData, "email"));
  const password = formValue(formData, "password");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !["OWNER", "ADMIN", "SUPPORT"].includes(user.role)) return { ok: false, message: "Неверные данные." };
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, message: "Неверные данные." };
  await createSession(user.id, user.role);
  await prisma.auditLog.create({ data: { adminId: user.id, action: "admin.login", entity: "User", entityId: user.id } });
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function createOrder(formData: FormData) {
  const user = await requireUser();
  const parsed = orderSchema.parse({ planId: formValue(formData, "planId"), bank: formValue(formData, "bank") });
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: parsed.planId } });
  const provider = new ManualTransferProvider();
  const order = await provider.createOrder({
    userId: user.id,
    amountRub: plan.priceRub,
    bank: parsed.bank,
    planId: plan.id,
    idempotencyKey: `manual:${user.id}:${plan.id}:${parsed.bank}:${new Date().toISOString().slice(0, 10)}`
  });
  redirect(`/account/orders/${order.id}`);
}

export async function markOrderPaid(formData: FormData) {
  const user = await requireUser();
  const orderId = formValue(formData, "orderId");
  await new ManualTransferProvider().markAsPaid(orderId, user.id);
  revalidatePath("/account");
  revalidatePath(`/account/orders/${orderId}`);
}

export async function startTrial() {
  const user = await requireUser();
  await activateTrial(user.id);
  revalidatePath("/account");
}

export async function createTicket(formData: FormData) {
  const user = await requireUser();
  const parsed = ticketSchema.parse({
    subject: formValue(formData, "subject"),
    category: formValue(formData, "category"),
    body: formValue(formData, "body")
  });
  const ticket = await prisma.ticket.create({
    data: {
      userId: user.id,
      subject: parsed.subject,
      category: parsed.category,
      messages: { create: { body: parsed.body, authorId: user.id } }
    }
  });
  redirect(`/account/tickets/${ticket.id}`);
}

export async function adminConfirmOrder(formData: FormData) {
  const admin = await requireAdmin(["OWNER", "ADMIN"]);
  await confirmManualOrder(formValue(formData, "orderId"), admin.id, formValue(formData, "approve") === "true", formValue(formData, "comment"));
  revalidatePath("/admin");
}

export async function adminRetryIssue(formData: FormData) {
  const admin = await requireAdmin(["OWNER", "ADMIN"]);
  await issueSubscriptionForOrder(formValue(formData, "orderId"), admin.id);
  revalidatePath("/admin");
}

export async function adminUpdateSettings(formData: FormData) {
  await requireAdmin(["OWNER", "ADMIN"]);
  const normal = ["site_name", "support_telegram", "payment_phone", "payment_instruction_ru", "payment_instruction_en", "trial_days", "pasarguard_mode", "pasarguard_base_url", "pasarguard_admin_username", "pasarguard_user_template_id", "smtp_enabled", "smtp_host", "smtp_port", "smtp_user", "smtp_from", "push_enabled"];
  const encrypted = ["pasarguard_token", "pasarguard_admin_password", "smtp_password", "vapid_public_key", "vapid_private_key"];
  await Promise.all(normal.map((key) => setSetting(key, formValue(formData, key), false)));
  await Promise.all(encrypted.map((key) => (formData.has(key) && formValue(formData, key) ? setSetting(key, formValue(formData, key), true) : Promise.resolve())));
  await setSetting(
    "enabled_banks",
    JSON.stringify({ tinkoff: formData.has("bank_tinkoff"), sber: formData.has("bank_sber"), ozon: formData.has("bank_ozon") })
  );
  revalidatePath("/admin");
}

export async function adminCheckPasarGuard() {
  await requireAdmin(["OWNER", "ADMIN"]);
  const service = await PasarGuardService.fromSettings();
  const result = await service.checkConnection();
  await prisma.integrationLog.create({ data: { type: "pasarguard", level: "info", message: "Connection checked", meta: result } });
  revalidatePath("/admin");
}

export async function updateServiceStatus(formData: FormData) {
  await requireAdmin(["OWNER", "ADMIN"]);
  const existing = await prisma.serviceStatus.findFirst();
  await prisma.serviceStatus.upsert({
    where: { id: existing?.id || "service-status" },
    update: {
      state: formValue(formData, "state") as never,
      messageRu: formValue(formData, "messageRu"),
      messageEn: formValue(formData, "messageEn")
    },
    create: {
      id: "service-status",
      state: formValue(formData, "state") as never,
      messageRu: formValue(formData, "messageRu"),
      messageEn: formValue(formData, "messageEn")
    }
  });
  revalidatePath("/");
  revalidatePath("/status");
}

export async function adminSavePlan(formData: FormData) {
  await requireAdmin(["OWNER", "ADMIN"]);
  const id = formValue(formData, "id");
  const data = {
    titleRu: formValue(formData, "titleRu"),
    titleEn: formValue(formData, "titleEn") || formValue(formData, "titleRu"),
    months: Number(formValue(formData, "months")),
    priceRub: Number(formValue(formData, "priceRub")),
    isVisible: formData.has("isVisible"),
    sortOrder: Number(formValue(formData, "sortOrder") || 0)
  };
  if (id) await prisma.plan.update({ where: { id }, data });
  else await prisma.plan.create({ data });
  revalidatePath("/admin");
  revalidatePath("/plans");
}

export async function adminCreateNews(formData: FormData) {
  await requireAdmin(["OWNER", "ADMIN"]);
  const titleRu = formValue(formData, "titleRu");
  await prisma.newsPost.create({
    data: {
      slug: formValue(formData, "slug"),
      titleRu,
      titleEn: formValue(formData, "titleEn") || titleRu,
      bodyRu: formValue(formData, "bodyRu"),
      bodyEn: formValue(formData, "bodyEn") || formValue(formData, "bodyRu"),
      isPublished: formData.has("isPublished"),
      publishedAt: formData.has("isPublished") ? new Date() : null
    }
  });
  revalidatePath("/admin");
  revalidatePath("/news");
}

export async function adminCreateFaq(formData: FormData) {
  await requireAdmin(["OWNER", "ADMIN"]);
  await prisma.faqItem.create({
    data: {
      questionRu: formValue(formData, "questionRu"),
      questionEn: formValue(formData, "questionEn") || formValue(formData, "questionRu"),
      answerRu: formValue(formData, "answerRu"),
      answerEn: formValue(formData, "answerEn") || formValue(formData, "answerRu"),
      sortOrder: Number(formValue(formData, "sortOrder") || 0),
      isVisible: true
    }
  });
  revalidatePath("/admin");
  revalidatePath("/faq");
}

export async function adminCreateInstruction(formData: FormData) {
  await requireAdmin(["OWNER", "ADMIN"]);
  await prisma.instruction.create({
    data: {
      appName: formValue(formData, "appName"),
      slug: formValue(formData, "slug"),
      bodyRu: formValue(formData, "bodyRu"),
      bodyEn: formValue(formData, "bodyEn") || formValue(formData, "bodyRu"),
      sortOrder: Number(formValue(formData, "sortOrder") || 0),
      isVisible: true
    }
  });
  revalidatePath("/admin");
  revalidatePath("/instructions");
}

export async function adminCreateFundraiser(formData: FormData) {
  await requireAdmin(["OWNER", "ADMIN"]);
  await prisma.fundraiser.create({
    data: {
      titleRu: formValue(formData, "titleRu"),
      titleEn: formValue(formData, "titleEn") || formValue(formData, "titleRu"),
      descriptionRu: formValue(formData, "descriptionRu"),
      descriptionEn: formValue(formData, "descriptionEn") || formValue(formData, "descriptionRu"),
      goalRub: Number(formValue(formData, "goalRub")),
      status: formValue(formData, "status") as never
    }
  });
  revalidatePath("/admin");
  revalidatePath("/fundraisers");
}

export async function adminReplyTicket(formData: FormData) {
  const admin = await requireAdmin(["OWNER", "ADMIN", "SUPPORT"]);
  const ticketId = formValue(formData, "ticketId");
  const body = formValue(formData, "body");
  if (body) await prisma.ticketMessage.create({ data: { ticketId, body, isAdmin: true, authorId: admin.id } });
  await prisma.ticket.update({ where: { id: ticketId }, data: { status: formValue(formData, "status") as never, assignedToId: admin.id } });
  revalidatePath("/admin");
}

export async function setupInstall(_: unknown, formData: FormData) {
  const adminCount = await prisma.user.count({ where: { role: { in: ["OWNER", "ADMIN"] } } });
  if (adminCount > 0 && (await getSetting("setup_completed")) === "true") return { ok: false, message: "Setup already completed." };
  const parsed = setupSchema.parse({
    siteName: formValue(formData, "siteName"),
    adminEmail: formValue(formData, "adminEmail"),
    adminPassword: formValue(formData, "adminPassword"),
    paymentPhone: formValue(formData, "paymentPhone"),
    supportTelegram: formValue(formData, "supportTelegram"),
    trialDays: formValue(formData, "trialDays"),
    pasarguardBaseUrl: formValue(formData, "pasarguardBaseUrl"),
    pasarguardMode: formValue(formData, "pasarguardMode") || "mock"
  });
  await setSetting("site_name", parsed.siteName);
  await setSetting("payment_phone", parsed.paymentPhone);
  await setSetting("support_telegram", parsed.supportTelegram);
  await setSetting("trial_days", String(parsed.trialDays));
  await setSetting("pasarguard_base_url", parsed.pasarguardBaseUrl || "");
  await setSetting("pasarguard_mode", parsed.pasarguardMode);
  await setSetting("setup_completed", "true");
  await prisma.user.upsert({
    where: { email: parsed.adminEmail },
    update: { role: "OWNER", passwordHash: await bcrypt.hash(parsed.adminPassword, 12) },
    create: { email: parsed.adminEmail, role: "OWNER", passwordHash: await bcrypt.hash(parsed.adminPassword, 12) }
  });
  redirect("/admin/login");
}
