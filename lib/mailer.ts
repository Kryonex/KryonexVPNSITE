import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { safeError } from "@/lib/crypto";

export async function sendEmail(to: string, subject: string, text: string, userId?: string) {
  const settings = await getSettings([
    "smtp_enabled",
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_password",
    "smtp_from"
  ]);

  if (settings.smtp_enabled !== "true") {
    await prisma.emailLog.create({ data: { to, subject, status: "skipped", userId, meta: { preview: text } } });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: Number(settings.smtp_port || 587),
      secure: Number(settings.smtp_port) === 465,
      auth: settings.smtp_user ? { user: settings.smtp_user, pass: settings.smtp_password } : undefined
    });
    await transporter.sendMail({
      to,
      from: settings.smtp_from || settings.smtp_user,
      subject,
      text
    });
    await prisma.emailLog.create({ data: { to, subject, status: "sent", userId } });
  } catch (error) {
    await prisma.emailLog.create({ data: { to, subject, status: "failed", userId, error: safeError(error) } });
    throw error;
  }
}
