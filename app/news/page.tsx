import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";

export default async function NewsPage() {
  const posts = await prisma.newsPost.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" } });
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Новости</h1>
      <div className="mt-8 grid gap-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <Link href={`/news/${post.slug}`} className="text-2xl font-semibold">{post.titleRu}</Link>
            <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{post.publishedAt?.toLocaleDateString("ru-RU")}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
