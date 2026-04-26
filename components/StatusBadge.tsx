import { prisma } from "@/lib/db";

const labels = {
  operational: "Работает",
  maintenance: "Технические работы",
  scheduled: "Работы запланированы",
  degraded: "Частичная деградация"
};

export async function StatusBadge() {
  const status = (await prisma.serviceStatus.findFirst()) || { state: "operational", messageRu: "Все системы работают штатно" };
  const tone =
    status.state === "operational"
      ? "border-matcha/30 bg-matcha/10 text-matcha"
      : status.state === "degraded"
        ? "border-moon/40 bg-moon/15 text-amber-700 dark:text-moon"
        : "border-sakura/40 bg-sakura/15 text-rose-700 dark:text-sakura";
  return (
    <div className={`inline-flex max-w-full items-center gap-2 rounded-md border px-3 py-2 text-sm ${tone}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      <span className="font-medium">{labels[status.state]}</span>
      <span className="hidden truncate sm:inline">{status.messageRu}</span>
    </div>
  );
}
