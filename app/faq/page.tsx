import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";

export default async function FaqPage() {
  const items = await prisma.faqItem.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-semibold">FAQ</h1>
      <div className="mt-8 space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <h2 className="font-semibold">{item.questionRu}</h2>
            <p className="mt-2 text-ink/70 dark:text-paper/70">{item.answerRu}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
