import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";

export default async function InstructionsPage() {
  const items = await prisma.instruction.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Инструкции подключения</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id}>
            <Link href={`/instructions/${item.slug}`} className="text-xl font-semibold">{item.appName}</Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
