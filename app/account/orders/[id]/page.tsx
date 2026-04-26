import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getSetting } from "@/lib/settings";
import { Card } from "@/components/ui";
import { markOrderPaid } from "@/app/actions";

const bankLabels: Record<string, string> = { tinkoff: "Т-Банк", sber: "Сбербанк", ozon: "Озон Банк" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;
  const [order, phone, instruction] = await Promise.all([
    prisma.order.findFirst({ where: { id, userId: user.id }, include: { plan: true, subscription: true } }),
    getSetting("payment_phone"),
    getSetting("payment_instruction_ru")
  ]);
  if (!order) redirect("/account");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <h1 className="text-3xl font-semibold">Заказ #{order.number}</h1>
        <div className="mt-5 space-y-2">
          <p>Статус: <strong>{order.status}</strong></p>
          <p>Сумма: <strong>{order.amountRub} ₽</strong></p>
          <p>Банк: <strong>{order.bank ? bankLabels[order.bank] : "не выбран"}</strong></p>
          <p>Номер телефона: <strong>{phone || "не задан"}</strong></p>
          <p className="rounded-md bg-ink/5 p-3 text-sm dark:bg-white/10">{instruction}</p>
        </div>
        {order.status === "pending_payment" ? (
          <form action={markOrderPaid} className="mt-6">
            <input type="hidden" name="orderId" value={order.id} />
            <button className="rounded-md bg-matcha px-5 py-3 font-medium text-white">Я оплатил</button>
          </form>
        ) : null}
        {order.status === "issue_failed" ? <p className="mt-4 text-sm text-rose-600">Ошибка выдачи: {order.lastIssueError}. Админ может повторить выдачу.</p> : null}
      </Card>
    </div>
  );
}
