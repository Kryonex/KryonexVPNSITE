import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({ where: { id, userId: user.id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!ticket) redirect("/account");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <h1 className="text-3xl font-semibold">Тикет #{ticket.number}</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{ticket.subject} · {ticket.status}</p>
        <div className="mt-6 space-y-3">
          {ticket.messages.map((message) => (
            <div key={message.id} className={`rounded-md p-3 text-sm ${message.isAdmin ? "bg-matcha/10" : "bg-ink/5 dark:bg-white/10"}`}>{message.body}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}
