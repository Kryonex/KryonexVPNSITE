import type { Order } from "@prisma/client";

export type CreatePaymentInput = {
  userId: string;
  amountRub: number;
  bank: string;
  planId?: string;
  fundraiserId?: string;
  idempotencyKey: string;
};

export interface PaymentProvider {
  createOrder(input: CreatePaymentInput): Promise<Order>;
  markAsPaid(orderId: string, userId: string): Promise<Order>;
}
