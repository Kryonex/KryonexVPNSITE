import Link from "next/link";
import { ArrowRight, Globe2, ServerCog, ShieldCheck, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { getSetting } from "@/lib/settings";

export default async function HomePage() {
  const [plans, posts, faqs, fundraisers, telegram] = await Promise.all([
    prisma.plan.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.newsPost.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" }, take: 3 }),
    prisma.faqItem.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" }, take: 4 }),
    prisma.fundraiser.findMany({ where: { status: "active" }, orderBy: { createdAt: "desc" }, take: 2 }),
    getSetting("support_telegram")
  ]);
  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div className="flex flex-col justify-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.28em] text-matcha">легальный VPN-доступ</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-ink dark:text-paper md:text-7xl">ZEROVPN</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70 dark:text-paper/70">
            Спокойный VPN-сервис для пользователей из РФ: ручная оплата переводом, безлимитный трафик, неограниченное количество устройств и автоматическая выдача subscription URL.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/plans" className="inline-flex h-12 items-center gap-2 rounded-md bg-ink px-5 font-medium text-paper dark:bg-paper dark:text-ink">
              Купить подписку <ArrowRight size={18} />
            </Link>
            <Link href="/account" className="inline-flex h-12 items-center rounded-md border border-ink/15 px-5 font-medium dark:border-white/15">
              Пробный период 3 дня
            </Link>
          </div>
        </div>
        <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-ink/10 bg-[linear-gradient(140deg,#f7f2ea,#dbe4d8_48%,#f1dadd)] p-8 shadow-soft dark:border-white/10 dark:bg-[linear-gradient(140deg,#202725,#314138_55%,#31272a)]">
          <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,transparent,rgba(23,32,29,.16))]" />
          <div className="absolute bottom-10 left-8 right-8 flex items-end gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-ink/70 dark:bg-paper/70" style={{ height: 40 + ((i * 23) % 150) }} />
            ))}
          </div>
          <div className="absolute right-10 top-10 h-24 w-24 rounded-full border border-ink/20 bg-moon/70 dark:border-paper/20" />
          <div className="relative z-10 max-w-xs text-sm leading-6 text-ink/75 dark:text-paper/75">
            Tokyo skyline, мягкие линии, стабильное подключение и аккуратная инфраструктура без агрессивного неона.
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-4">
        {[
          ["Стабильность", "Серверы и статус сервиса видны пользователю.", ShieldCheck],
          ["Обновления", "Новости, FAQ и инструкции редактируются из админки.", Sparkles],
          ["Локации", "Сборы на новые серверы и аренда под заказ.", Globe2],
          ["Автовыдача", "PasarGuard issue/retry после подтверждения оплаты.", ServerCog]
        ].map(([title, text, Icon]) => (
          <Card key={String(title)}>
            <Icon className="mb-4 text-matcha" />
            <h2 className="font-semibold">{title as string}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65 dark:text-paper/65">{text as string}</p>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 className="text-3xl font-semibold">Тарифы</h2>
          <Link href="/plans" className="text-sm text-matcha">Все тарифы</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <h3 className="font-semibold">{plan.titleRu}</h3>
              <p className="mt-3 text-3xl font-semibold">{plan.priceRub} ₽</p>
              <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">Безлимитный трафик, устройств без ограничения.</p>
              <Link href={`/plans?plan=${plan.id}`} className="mt-5 inline-flex h-10 items-center rounded-md bg-ink px-4 text-sm font-medium text-paper dark:bg-paper dark:text-ink">Выбрать</Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-3">
        <Card>
          <h2 className="mb-4 text-2xl font-semibold">Новости</h2>
          <div className="space-y-3">
            {posts.map((post) => <Link key={post.id} href={`/news/${post.slug}`} className="block text-sm">{post.titleRu}</Link>)}
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-2xl font-semibold">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((faq) => <p key={faq.id} className="text-sm">{faq.questionRu}</p>)}
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-2xl font-semibold">Поддержка</h2>
          <p className="text-sm leading-6 text-ink/65 dark:text-paper/65">Откройте тикет в кабинете или напишите в Telegram.</p>
          {telegram ? <Link className="mt-4 block text-matcha" href={telegram}>Telegram</Link> : null}
        </Card>
      </section>

      {fundraisers.length ? (
        <section className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="mb-5 text-3xl font-semibold">Сборы на новые локации</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {fundraisers.map((fund) => (
              <Card key={fund.id}>
                <h3 className="font-semibold">{fund.titleRu}</h3>
                <div className="mt-4 h-2 rounded bg-ink/10 dark:bg-white/10">
                  <div className="h-2 rounded bg-matcha" style={{ width: `${Math.min(100, Math.round((fund.collectedRub / fund.goalRub) * 100))}%` }} />
                </div>
                <p className="mt-2 text-sm">{fund.collectedRub} ₽ из {fund.goalRub} ₽</p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
