import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";

export default async function FundraisersPage() {
  const items = await prisma.fundraiser.findMany({ where: { status: { in: ["active", "completed"] } }, orderBy: { createdAt: "desc" } });
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Сборы на серверы и локации</h1>
      <div className="mt-8 grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <h2 className="text-2xl font-semibold">{item.titleRu}</h2>
            <p className="mt-2 text-ink/70 dark:text-paper/70">{item.descriptionRu}</p>
            <div className="mt-4 h-2 rounded bg-ink/10 dark:bg-white/10">
              <div className="h-2 rounded bg-matcha" style={{ width: `${Math.min(100, Math.round((item.collectedRub / item.goalRub) * 100))}%` }} />
            </div>
            <p className="mt-2 text-sm">{item.collectedRub} ₽ из {item.goalRub} ₽ · {item.status}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
