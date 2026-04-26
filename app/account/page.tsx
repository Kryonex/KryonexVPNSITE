import Link from "next/link";
import { redirect } from "next/navigation";
import { Copy, LifeBuoy, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui";
import { logout, startTrial } from "@/app/actions";

export default async function AccountPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const [subscription, orders, tickets, instructions, fundraisers] = await Promise.all([
    prisma.subscription.findFirst({ where: { userId: user.id }, orderBy: { endsAt: "desc" } }),
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8, include: { plan: true } }),
    prisma.ticket.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.instruction.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.fundraiser.findMany({ where: { status: "active" }, take: 3 })
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-semibold">Личный кабинет</h1>
          <p className="mt-2 text-ink/60 dark:text-paper/60">{user.email}</p>
        </div>
        <form action={logout}><button className="rounded-md border border-ink/15 px-4 py-2 text-sm dark:border-white/15">Выйти</button></form>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-2xl font-semibold">Подписка</h2>
          {subscription?.subscriptionUrl ? (
            <div className="mt-5 grid gap-5 md:grid-cols-[1fr_180px]">
              <div>
                <p>Статус: <strong>{subscription.status}</strong></p>
                <p className="mt-1">Действует до: <strong>{subscription.endsAt.toLocaleDateString("ru-RU")}</strong></p>
                <div className="mt-4 rounded-md bg-ink/5 p-3 text-sm break-all dark:bg-white/10">{subscription.subscriptionUrl}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm text-paper dark:bg-paper dark:text-ink"><Copy size={16} />Скопировать ссылку</button>
                  <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-ink/15 px-4 text-sm dark:border-white/15" href="/plans"><RefreshCw size={16} />Продлить</Link>
                </div>
              </div>
              {subscription.qrDataUrl ? <img src={subscription.qrDataUrl} alt="QR subscription URL" className="h-44 w-44 rounded-md bg-white p-2" /> : null}
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-ink/65 dark:text-paper/65">Активной подписки пока нет.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/plans" className="rounded-md bg-ink px-4 py-2 text-paper dark:bg-paper dark:text-ink">Купить</Link>
                {!user.trialUsed ? <form action={startTrial}><button className="rounded-md border border-ink/15 px-4 py-2 dark:border-white/15">Активировать trial</button></form> : null}
              </div>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-2xl font-semibold">Заказы</h2>
          <div className="mt-4 space-y-3 text-sm">
            {orders.map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="flex justify-between rounded-md bg-ink/5 p-3 dark:bg-white/10">
                <span>#{order.number} {order.plan?.titleRu || "Сбор"}</span>
                <span>{order.status}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card>
          <h2 className="text-xl font-semibold">Тикеты</h2>
          <Link href="/support" className="mt-3 inline-flex items-center gap-2 text-matcha"><LifeBuoy size={16} />Создать тикет</Link>
          <div className="mt-4 space-y-2 text-sm">{tickets.map((ticket) => <Link key={ticket.id} href={`/account/tickets/${ticket.id}`} className="block">{ticket.subject} · {ticket.status}</Link>)}</div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Инструкции</h2>
          <div className="mt-4 space-y-2 text-sm">{instructions.map((item) => <Link key={item.id} href={`/instructions/${item.slug}`} className="block">{item.appName}</Link>)}</div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Сборы</h2>
          <div className="mt-4 space-y-2 text-sm">{fundraisers.map((item) => <Link key={item.id} href="/fundraisers" className="block">{item.titleRu}: {item.collectedRub}/{item.goalRub} ₽</Link>)}</div>
        </Card>
      </div>
    </div>
  );
}
