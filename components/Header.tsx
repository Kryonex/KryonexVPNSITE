import Link from "next/link";
import { Shield, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatusBadge } from "@/components/StatusBadge";
import { getSession } from "@/lib/session";

export async function Header({ siteName }: { siteName: string }) {
  const user = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur dark:border-white/10 dark:bg-sumi/85">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-wide">
          <Shield className="text-matcha" size={24} />
          <span>{siteName}</span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-3 text-sm text-ink/75 dark:text-paper/75">
          <Link href="/plans">Тарифы</Link>
          <Link href="/news">Новости</Link>
          <Link href="/instructions">Инструкции</Link>
          <Link href="/fundraisers">Сборы</Link>
          <Link href="/support">Поддержка</Link>
          <Link href="/status">Статус</Link>
        </nav>
        <StatusBadge />
        <ThemeToggle />
        <Link className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-paper dark:bg-paper dark:text-ink" href={user ? "/account" : "/login"}>
          <UserRound size={17} />
          {user ? "Кабинет" : "Войти"}
        </Link>
      </div>
    </header>
  );
}
