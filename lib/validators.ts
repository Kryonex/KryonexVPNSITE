import { z } from "zod";

export const emailSchema = z.string().email().max(160).transform((value) => value.toLowerCase());
export const codeSchema = z.string().regex(/^\d{6}$/);
export const idSchema = z.string().min(8).max(64);

export const orderSchema = z.object({
  planId: idSchema,
  bank: z.enum(["tinkoff", "sber", "ozon"])
});

export const ticketSchema = z.object({
  subject: z.string().min(3).max(140),
  category: z.enum(["payment", "connection", "speed", "custom_server", "other"]),
  body: z.string().min(10).max(4000)
});

export const setupSchema = z.object({
  siteName: z.string().min(2).max(80),
  adminEmail: emailSchema,
  adminPassword: z.string().min(10).max(200),
  paymentPhone: z.string().min(5).max(40),
  supportTelegram: z.string().max(120).optional().default(""),
  trialDays: z.coerce.number().int().min(1).max(30).default(3),
  pasarguardBaseUrl: z.string().url().optional().or(z.literal("")),
  pasarguardMode: z.enum(["mock", "production"]).default("mock")
});
