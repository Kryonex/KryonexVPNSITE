import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";

export default async function NewsPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.newsPost.findUnique({ where: { slug } });
  if (!post || !post.isPublished) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <h1 className="text-4xl font-semibold">{post.titleRu}</h1>
        <div className="prose-lite mt-6 whitespace-pre-wrap leading-7 text-ink/75 dark:text-paper/75">{post.bodyRu}</div>
      </Card>
    </div>
  );
}
