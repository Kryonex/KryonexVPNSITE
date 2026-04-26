import { addHours } from "date-fns";
import { prisma } from "@/lib/db";
import type { CreatePaymentInput, PaymentProvider } from "@/lib/payments/PaymentProvider";

export class ManualTransferProvider implements PaymentProvider {
  async createOrder(input: CreatePaymentInput) {
    return prisma.order.upsert({
      where: { idempotencyKey: input.idempotencyKey },
      update: {},
      create: {
        userId: input.userId,
        amountRub: input.amountRub,
        bank: input.bank,
        planId: input.planId,
        fundraiserId: input.fundraiserId,
        idempotencyKey: input.idempotencyKey,
        expiresAt: addHours(new Date(), 12),
        kind: input.fundraiserId ? "fundraiser" : "subscription"
      }
    });
  }

  async markAsPaid(orderId: string, userId: string) {
    const order = await prisma.order.findFirstOrThrow({ where: { id: orderId, userId } });
    if (["payment_review", "paid", "issuing", "issued"].includes(order.status)) return order;
    return prisma.order.update({
      where: { id: orderId },
      data: { status: "payment_review", paymentMarkedAt: new Date() }
    });
  }
}
