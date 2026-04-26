import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { Card, Input, Select, Textarea } from "@/components/ui";
import {
  adminCheckPasarGuard,
  adminConfirmOrder,
  adminCreateFaq,
  adminCreateFundraiser,
  adminCreateInstruction,
  adminCreateNews,
  adminReplyTicket,
  adminRetryIssue,
  adminSavePlan,
  adminUpdateSettings,
  updateServiceStatus
} from "@/app/actions";

export default async function AdminPage() {
  const user = await getSession();
  if (!user || !["OWNER", "ADMIN", "SUPPORT"].includes(user.role)) redirect("/admin/login");
  const [orders, users, subscriptions, plans, status, settings, tickets, posts, faqs, instructions, fundraisers, logs] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { user: true, plan: true, fundraiser: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { subscriptions: { orderBy: { endsAt: "desc" }, take: 1 } } }),
    prisma.subscription.findMany({ orderBy: { endsAt: "asc" }, take: 20, include: { user: true } }),
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.serviceStatus.findFirst(),
    getSettings(["site_name", "support_telegram", "payment_phone", "payment_instruction_ru", "payment_instruction_en", "enabled_banks", "trial_days", "pasarguard_mode", "pasarguard_base_url", "pasarguard_admin_username", "pasarguard_user_template_id", "smtp_enabled", "smtp_host", "smtp_port", "smtp_user", "smtp_from", "push_enabled"]),
    prisma.ticket.findMany({ orderBy: { updatedAt: "desc" }, take: 20, include: { user: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } } }),
    prisma.newsPost.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" }, take: 10 }),
    prisma.instruction.findMany({ orderBy: { sortOrder: "asc" }, take: 10 }),
    prisma.fundraiser.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.integrationLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 })
  ]);
  const banks = JSON.parse(settings.enabled_banks || "{}") as Record<string, boolean>;
  const count = (statusName: string) => orders.filter((order) => order.status === statusName).length;
  const isSupport = user.role === "SUPPORT";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-4xl font-semibold">Админ-панель</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-5">
        <Card><p className="text-sm">Пользователи</p><p className="mt-2 text-3xl font-semibold">{users.length}</p></Card>
        <Card><p className="text-sm">Активные подписки</p><p className="mt-2 text-3xl font-semibold">{subscriptions.filter((s) => s.status === "active").length}</p></Card>
        <Card><p className="text-sm">Ожидают оплаты</p><p className="mt-2 text-3xl font-semibold">{count("payment_review")}</p></Card>
        <Card><p className="text-sm">Ошибки выдачи</p><p className="mt-2 text-3xl font-semibold">{count("issue_failed")}</p></Card>
        <Card><p className="text-sm">Тикеты</p><p className="mt-2 text-3xl font-semibold">{tickets.filter((t) => t.status !== "closed").length}</p></Card>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-2xl font-semibold">Заказы</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-ink/10 dark:border-white/10"><th>#</th><th>Email</th><th>Тариф</th><th>Сумма</th><th>Статус</th><th /></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-ink/5 dark:border-white/5">
                    <td className="py-2">{order.number}</td>
                    <td>{order.user.email}</td>
                    <td>{order.plan?.titleRu || order.fundraiser?.titleRu || order.kind}</td>
                    <td>{order.amountRub} ₽</td>
                    <td>{order.status}</td>
                    <td className="py-2">
                      {order.status === "payment_review" && !isSupport ? (
                        <div className="flex gap-2">
                          <form action={adminConfirmOrder}><input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="approve" value="true" /><button className="rounded bg-matcha px-3 py-1 text-white">Подтвердить</button></form>
                          <form action={adminConfirmOrder}><input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="approve" value="false" /><button className="rounded border px-3 py-1">Отклонить</button></form>
                        </div>
                      ) : null}
                      {order.status === "issue_failed" && !isSupport ? <form action={adminRetryIssue}><input type="hidden" name="orderId" value={order.id} /><button className="rounded bg-ink px-3 py-1 text-paper dark:bg-paper dark:text-ink">Повторить выдачу</button></form> : null}
                      {order.lastIssueError ? <p className="mt-1 max-w-xs truncate text-rose-600">{order.lastIssueError}</p> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold">Статус сервиса</h2>
          <form action={updateServiceStatus} className="mt-4 space-y-3">
            <Select name="state" defaultValue={status?.state || "operational"}>
              <option value="operational">работает</option>
              <option value="maintenance">технические работы</option>
              <option value="scheduled">запланированы работы</option>
              <option value="degraded">частичная деградация</option>
            </Select>
            <Input name="messageRu" defaultValue={status?.messageRu} placeholder="Сообщение RU" />
            <Input name="messageEn" defaultValue={status?.messageEn} placeholder="Message EN" />
            <button className="rounded-md bg-ink px-4 py-2 text-paper dark:bg-paper dark:text-ink">Сохранить</button>
          </form>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-semibold">Настройки</h2>
          <form action={adminUpdateSettings} className="mt-4 grid gap-3">
            <Input name="site_name" defaultValue={settings.site_name} placeholder="Название сайта" />
            <Input name="support_telegram" defaultValue={settings.support_telegram} placeholder="Telegram поддержки" />
            <Input name="payment_phone" defaultValue={settings.payment_phone} placeholder="Телефон оплаты" />
            <Textarea name="payment_instruction_ru" defaultValue={settings.payment_instruction_ru} />
            <Textarea name="payment_instruction_en" defaultValue={settings.payment_instruction_en} />
            <div className="flex flex-wrap gap-3 text-sm">
              <label><input name="bank_tinkoff" type="checkbox" defaultChecked={banks.tinkoff} /> Т-Банк</label>
              <label><input name="bank_sber" type="checkbox" defaultChecked={banks.sber} /> Сбербанк</label>
              <label><input name="bank_ozon" type="checkbox" defaultChecked={banks.ozon} /> Озон Банк</label>
            </div>
            <Input name="trial_days" defaultValue={settings.trial_days} placeholder="Trial days" />
            <Select name="pasarguard_mode" defaultValue={settings.pasarguard_mode}><option value="mock">mock</option><option value="production">production</option></Select>
            <Input name="pasarguard_base_url" defaultValue={settings.pasarguard_base_url} placeholder="PasarGuard URL" />
            <Input name="pasarguard_admin_username" defaultValue={settings.pasarguard_admin_username} placeholder="PasarGuard admin username" />
            <Input name="pasarguard_admin_password" type="password" placeholder="Новый PasarGuard password" />
            <Input name="pasarguard_token" type="password" placeholder="Новый PasarGuard token" />
            <Input name="pasarguard_user_template_id" defaultValue={settings.pasarguard_user_template_id} placeholder="User template ID" />
            <Select name="smtp_enabled" defaultValue={settings.smtp_enabled}><option value="false">SMTP off</option><option value="true">SMTP on</option></Select>
            <Input name="smtp_host" defaultValue={settings.smtp_host} placeholder="SMTP host" />
            <Input name="smtp_port" defaultValue={settings.smtp_port} placeholder="SMTP port" />
            <Input name="smtp_user" defaultValue={settings.smtp_user} placeholder="SMTP user" />
            <Input name="smtp_password" type="password" placeholder="Новый SMTP password" />
            <Input name="smtp_from" defaultValue={settings.smtp_from} placeholder="From email" />
            <Select name="push_enabled" defaultValue={settings.push_enabled}><option value="false">Push off</option><option value="true">Push on</option></Select>
            <Input name="vapid_public_key" placeholder="VAPID public key" />
            <Input name="vapid_private_key" type="password" placeholder="VAPID private key" />
            <div className="flex gap-2">
              <button className="rounded-md bg-ink px-4 py-2 text-paper dark:bg-paper dark:text-ink">Сохранить настройки</button>
            </div>
          </form>
          <form action={adminCheckPasarGuard} className="mt-3"><button className="rounded-md border border-ink/15 px-4 py-2 dark:border-white/15">Проверить PasarGuard</button></form>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold">Тарифы</h2>
          <div className="mt-3 space-y-2 text-sm">{plans.map((plan) => <p key={plan.id}>{plan.titleRu}: {plan.priceRub} ₽ / {plan.months} мес.</p>)}</div>
          <form action={adminSavePlan} className="mt-5 grid gap-3">
            <Input name="titleRu" placeholder="1 месяц" required />
            <Input name="titleEn" placeholder="1 month" />
            <Input name="months" type="number" placeholder="months" required />
            <Input name="priceRub" type="number" placeholder="price RUB" required />
            <Input name="sortOrder" type="number" placeholder="sort" />
            <label className="text-sm"><input name="isVisible" type="checkbox" defaultChecked /> Показывать</label>
            <button className="rounded-md bg-ink px-4 py-2 text-paper dark:bg-paper dark:text-ink">Добавить тариф</button>
          </form>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="text-xl font-semibold">Новости</h2>
          <div className="mt-2 space-y-1 text-sm">{posts.map((p) => <p key={p.id}>{p.titleRu} · {p.isPublished ? "published" : "draft"}</p>)}</div>
          <form action={adminCreateNews} className="mt-4 grid gap-2">
            <Input name="slug" placeholder="slug" required /><Input name="titleRu" placeholder="Title RU" required /><Input name="titleEn" placeholder="Title EN" /><Textarea name="bodyRu" placeholder="Body RU" required /><Textarea name="bodyEn" placeholder="Body EN" /><label className="text-sm"><input name="isPublished" type="checkbox" /> Опубликовать</label><button className="rounded bg-ink px-3 py-2 text-paper dark:bg-paper dark:text-ink">Создать</button>
          </form>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="mt-2 space-y-1 text-sm">{faqs.map((f) => <p key={f.id}>{f.questionRu}</p>)}</div>
          <form action={adminCreateFaq} className="mt-4 grid gap-2">
            <Input name="questionRu" placeholder="Question RU" required /><Input name="questionEn" placeholder="Question EN" /><Textarea name="answerRu" placeholder="Answer RU" required /><Textarea name="answerEn" placeholder="Answer EN" /><Input name="sortOrder" type="number" placeholder="sort" /><button className="rounded bg-ink px-3 py-2 text-paper dark:bg-paper dark:text-ink">Создать</button>
          </form>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Инструкции</h2>
          <div className="mt-2 space-y-1 text-sm">{instructions.map((i) => <p key={i.id}>{i.appName}</p>)}</div>
          <form action={adminCreateInstruction} className="mt-4 grid gap-2">
            <Input name="appName" placeholder="App name" required /><Input name="slug" placeholder="slug" required /><Textarea name="bodyRu" placeholder="Body RU" required /><Textarea name="bodyEn" placeholder="Body EN" /><Input name="sortOrder" type="number" placeholder="sort" /><button className="rounded bg-ink px-3 py-2 text-paper dark:bg-paper dark:text-ink">Создать</button>
          </form>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-semibold">Тикеты</h2>
          <div className="mt-4 space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-md bg-ink/5 p-3 text-sm dark:bg-white/10">
                <p className="font-medium">#{ticket.number} {ticket.subject} · {ticket.user.email} · {ticket.status}</p>
                <p className="mt-1">{ticket.messages[0]?.body}</p>
                <form action={adminReplyTicket} className="mt-3 grid gap-2">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <Select name="status" defaultValue={ticket.status}><option value="open">open</option><option value="pending">pending</option><option value="resolved">resolved</option><option value="closed">closed</option></Select>
                  <Textarea name="body" placeholder="Ответ" />
                  <button className="rounded bg-ink px-3 py-2 text-paper dark:bg-paper dark:text-ink">Ответить/обновить</button>
                </form>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-semibold">Сборы</h2>
          <div className="mt-2 space-y-1 text-sm">{fundraisers.map((f) => <p key={f.id}>{f.titleRu}: {f.collectedRub}/{f.goalRub} ₽ · {f.status}</p>)}</div>
          <form action={adminCreateFundraiser} className="mt-4 grid gap-2">
            <Input name="titleRu" placeholder="Название RU" required /><Input name="titleEn" placeholder="Title EN" /><Textarea name="descriptionRu" placeholder="Описание RU" required /><Textarea name="descriptionEn" placeholder="Description EN" /><Input name="goalRub" type="number" placeholder="Цель RUB" required /><Select name="status" defaultValue="active"><option value="draft">draft</option><option value="active">active</option><option value="completed">completed</option><option value="cancelled">cancelled</option></Select><button className="rounded bg-ink px-3 py-2 text-paper dark:bg-paper dark:text-ink">Создать сбор</button>
          </form>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-semibold">Пользователи</h2>
          <div className="mt-4 space-y-2 text-sm">{users.map((item) => <p key={item.id}>{item.email} · {item.role} · trial {String(item.trialUsed)} · {item.subscriptions[0]?.endsAt?.toLocaleDateString("ru-RU") || "нет подписки"}</p>)}</div>
        </Card>
        <Card>
          <h2 className="text-2xl font-semibold">Логи интеграций</h2>
          <div className="mt-4 space-y-2 text-sm">{logs.map((log) => <p key={log.id}>{log.createdAt.toLocaleString("ru-RU")} · {log.type} · {log.level} · {log.message}</p>)}</div>
        </Card>
      </section>
    </div>
  );
}
