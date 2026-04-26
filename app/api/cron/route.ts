import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  await prisma.order.updateMany({ where: { status: "pending_payment", expiresAt: { lt: now } }, data: { status: "expired" } });
  const soon = await prisma.subscription.findMany({
    where: { status: "active", endsAt: { gte: now, lte: addDays(now, 3) } },
    include: { user: true }
  });
  for (const sub of soon) {
    await sendEmail(sub.user.email, "ZEROVPN: подписка скоро закончится", `Подписка действует до ${sub.endsAt.toLocaleDateString("ru-RU")}.`, sub.userId);
  }
  await prisma.subscription.updateMany({ where: { status: "active", endsAt: { lt: now } }, data: { status: "expired" } });
  return NextResponse.json({ ok: true, reminders: soon.length });
}
