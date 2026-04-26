import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";

export default async function InstructionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await prisma.instruction.findUnique({ where: { slug } });
  if (!item || !item.isVisible) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <h1 className="text-4xl font-semibold">{item.appName}</h1>
        <div className="prose-lite mt-6 whitespace-pre-wrap leading-7 text-ink/75 dark:text-paper/75">{item.bodyRu}</div>
      </Card>
    </div>
  );
}
