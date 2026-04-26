import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-ink/10 px-4 py-8 text-sm text-ink/60 dark:border-white/10 dark:text-paper/60">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-4">
        <span>ZEROVPN работает только для законного VPN-доступа.</span>
        <Link href="/legal/privacy">Конфиденциальность</Link>
        <Link href="/legal/terms">Соглашение</Link>
        <Link href="/legal/refund">Возвраты</Link>
        <Link href="/legal/acceptable-use">Законное использование</Link>
        <Link href="/admin">Админка</Link>
      </div>
    </footer>
  );
}
