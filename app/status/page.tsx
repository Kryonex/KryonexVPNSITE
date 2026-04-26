import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";

export default async function StatusPage() {
  const status = await prisma.serviceStatus.findFirst();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <h1 className="text-4xl font-semibold">Статус сервиса</h1>
        <p className="mt-4 text-2xl">{status?.state || "operational"}</p>
        <p className="mt-3 text-ink/70 dark:text-paper/70">{status?.messageRu || "Все системы работают штатно"}</p>
        {status?.startsAt ? <p className="mt-3 text-sm">Начало: {status.startsAt.toLocaleString("ru-RU")}</p> : null}
        {status?.endsAt ? <p className="text-sm">Окончание: {status.endsAt.toLocaleString("ru-RU")}</p> : null}
      </Card>
    </div>
  );
}
