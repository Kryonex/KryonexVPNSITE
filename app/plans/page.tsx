import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { Card, Select } from "@/components/ui";
import { createOrder } from "@/app/actions";
import { getSession } from "@/lib/session";

const bankLabels: Record<string, string> = { tinkoff: "Т-Банк", sber: "Сбербанк", ozon: "Озон Банк" };

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const [{ plan }, plans, user, phone, banksRaw, instruction] = await Promise.all([
    searchParams,
    prisma.plan.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } }),
    getSession(),
    getSetting("payment_phone"),
    getSetting("enabled_banks"),
    getSetting("payment_instruction_ru")
  ]);
  const banks = JSON.parse(banksRaw || "{}") as Record<string, boolean>;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Тарифы и покупка</h1>
      <p className="mt-3 max-w-2xl text-ink/65 dark:text-paper/65">Оплата вручную переводом. После проверки админом подписка выдаётся автоматически через PasarGuard.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {plans.map((item) => (
          <Card key={item.id} className={plan === item.id ? "border-matcha" : ""}>
            <h2 className="font-semibold">{item.titleRu}</h2>
            <p className="mt-3 text-3xl font-semibold">{item.priceRub} ₽</p>
            <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{item.months} мес., безлимитный трафик, устройств без ограничения.</p>
          </Card>
        ))}
      </div>
      <Card className="mt-8 max-w-xl">
        <h2 className="text-2xl font-semibold">Оформить заказ</h2>
        {user ? (
          <form action={createOrder} className="mt-5 space-y-4">
            <label className="block text-sm font-medium">Тариф</label>
            <Select name="planId" defaultValue={plan || plans[0]?.id} required>
              {plans.map((item) => <option key={item.id} value={item.id}>{item.titleRu} — {item.priceRub} ₽</option>)}
            </Select>
            <label className="block text-sm font-medium">Банк</label>
            <Select name="bank" required>
              {Object.entries(banks).filter(([, enabled]) => enabled).map(([key]) => <option key={key} value={key}>{bankLabels[key]}</option>)}
            </Select>
            <p className="rounded-md bg-ink/5 p-3 text-sm dark:bg-white/10">{instruction} Номер: <strong>{phone || "задайте в админке"}</strong></p>
            <button className="h-11 rounded-md bg-ink px-5 font-medium text-paper dark:bg-paper dark:text-ink">Создать заказ</button>
          </form>
        ) : (
          <a className="mt-5 inline-flex h-11 items-center rounded-md bg-ink px-5 font-medium text-paper dark:bg-paper dark:text-ink" href="/login">Войти по email для покупки</a>
        )}
      </Card>
    </div>
  );
}
