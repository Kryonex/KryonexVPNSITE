import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSetting } from "@/lib/settings";
import { Card, Input, Select, Textarea } from "@/components/ui";
import { createTicket } from "@/app/actions";

export default async function SupportPage() {
  const [user, telegram] = await Promise.all([getSession(), getSetting("support_telegram")]);
  if (!user) redirect("/login");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <h1 className="text-3xl font-semibold">Поддержка</h1>
        {telegram ? <a className="mt-3 block text-matcha" href={telegram}>Telegram поддержки</a> : null}
        <form action={createTicket} className="mt-6 space-y-4">
          <Input name="subject" placeholder="Тема" required />
          <Select name="category" required>
            <option value="payment">Оплата</option>
            <option value="connection">Подключение</option>
            <option value="speed">Скорость</option>
            <option value="custom_server">Сервер под заказ</option>
            <option value="other">Другое</option>
          </Select>
          <Textarea name="body" placeholder="Опишите вопрос" required />
          <button className="rounded-md bg-ink px-5 py-3 font-medium text-paper dark:bg-paper dark:text-ink">Создать тикет</button>
        </form>
      </Card>
    </div>
  );
}
