import QRCode from "qrcode";
import { addDays, addMonths, isAfter } from "date-fns";
import { prisma } from "@/lib/db";
import { PasarGuardService } from "@/lib/pasarguard/PasarGuardService";
import { safeError } from "@/lib/crypto";
import { sendEmail } from "@/lib/mailer";
import { getSetting } from "@/lib/settings";

export async function issueSubscriptionForOrder(orderId: string, adminId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, plan: true, subscription: true }
  });
  if (!order || order.kind !== "subscription" || !order.plan) throw new Error("Order is not issuable");
  if (order.status === "issued" && order.subscriptionId) return order.subscriptionId;
  if (!["paid", "issue_failed", "issuing"].includes(order.status)) throw new Error("Order is not paid");

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "issuing", issueAttempts: { increment: 1 }, lastIssueError: null }
  });

  const active = await prisma.subscription.findFirst({
    where: { userId: order.userId, status: "active" },
    orderBy: { endsAt: "desc" }
  });
  const baseDate = active && isAfter(active.endsAt, new Date()) ? active.endsAt : new Date();
  const endsAt = addMonths(baseDate, order.plan.months);
  const username = active?.pasarguardUsername || `zv_${order.user.email.split("@")[0]?.replace(/[^a-z0-9_]/gi, "_")}_${order.user.id.slice(0, 6)}`.toLowerCase().slice(0, 32);

  try {
    const service = await PasarGuardService.fromSettings();
    const result = await service.createOrExtendSubscription({
      username,
      email: order.user.email,
      expiresAt: endsAt,
      days: order.plan.months * 30,
      isTrial: false,
      note: `ZEROVPN order #${order.number}`
    });
    const qrDataUrl = await QRCode.toDataURL(result.subscriptionUrl);
    const subscription = await prisma.subscription.upsert({
      where: { pasarguardUsername: result.username },
      update: {
        status: "active",
        endsAt,
        subscriptionUrl: result.subscriptionUrl,
        qrDataUrl,
        pasarguardUserId: result.providerUserId,
        pasarguardTemplateId: undefined,
        lastSyncedAt: new Date(),
        lastError: null
      },
      create: {
        userId: order.userId,
        status: "active",
        endsAt,
        subscriptionUrl: result.subscriptionUrl,
        qrDataUrl,
        pasarguardUsername: result.username,
        pasarguardUserId: result.providerUserId
      }
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "issued", issuedAt: new Date(), subscriptionId: subscription.id, lastIssueError: null }
    });
    if (adminId) {
      await prisma.auditLog.create({ data: { adminId, action: "order.issue", entity: "Order", entityId: order.id } });
    }
    await sendEmail(order.user.email, "ZEROVPN: подписка выдана", `Ваша подписка активна до ${endsAt.toLocaleDateString("ru-RU")}.`, order.userId);
    return subscription.id;
  } catch (error) {
    const message = safeError(error);
    await prisma.order.update({ where: { id: order.id }, data: { status: "issue_failed", lastIssueError: message } });
    await prisma.integrationLog.create({ data: { type: "pasarguard", level: "error", message: "Order issue failed", meta: { orderId, error: message } } });
    throw error;
  }
}

export async function confirmManualOrder(orderId: string, adminId: string, approve: boolean, comment?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { fundraiser: true } });
  if (!order) throw new Error("Order not found");
  if (order.status === "issued" || order.status === "rejected") return order;
  if (!approve) {
    await prisma.auditLog.create({ data: { adminId, action: "order.reject", entity: "Order", entityId: order.id, meta: { comment } } });
    return prisma.order.update({ where: { id: orderId }, data: { status: "rejected", adminComment: comment } });
  }
  const paid = await prisma.order.update({
    where: { id: orderId },
    data: { status: "paid", paidAt: new Date(), adminComment: comment }
  });
  await prisma.auditLog.create({ data: { adminId, action: "order.confirm", entity: "Order", entityId: order.id } });

  if (order.kind === "fundraiser" && order.fundraiserId) {
    await prisma.fundraiserContribution.upsert({
      where: { orderId: order.id },
      update: { confirmedAt: new Date() },
      create: { orderId: order.id, userId: order.userId, fundraiserId: order.fundraiserId, amountRub: order.amountRub, bank: order.bank, confirmedAt: new Date() }
    });
    const sum = await prisma.fundraiserContribution.aggregate({ where: { fundraiserId: order.fundraiserId, confirmedAt: { not: null } }, _sum: { amountRub: true } });
    await prisma.fundraiser.update({
      where: { id: order.fundraiserId },
      data: { collectedRub: sum._sum.amountRub || 0, status: (sum._sum.amountRub || 0) >= order.fundraiser!.goalRub ? "completed" : order.fundraiser!.status }
    });
    return paid;
  }

  await issueSubscriptionForOrder(orderId, adminId);
  return paid;
}

export async function activateTrial(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.trialUsed) throw new Error("Trial already used");
  const days = Number(await getSetting("trial_days")) || 3;
  const endsAt = addDays(new Date(), days);
  const username = `zv_trial_${user.id.slice(0, 12)}`;
  const service = await PasarGuardService.fromSettings();
  const result = await service.createOrExtendSubscription({ username, email: user.email, expiresAt: endsAt, days, isTrial: true });
  const qrDataUrl = await QRCode.toDataURL(result.subscriptionUrl);
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      status: "active",
      endsAt,
      subscriptionUrl: result.subscriptionUrl,
      qrDataUrl,
      pasarguardUsername: result.username,
      pasarguardUserId: result.providerUserId,
      isTrial: true
    }
  });
  await prisma.trialActivation.create({ data: { email: user.email, userId, days, subscriptionId: subscription.id } });
  await prisma.user.update({ where: { id: userId }, data: { trialUsed: true } });
  return subscription;
}
