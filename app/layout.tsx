import type { Metadata } from "next";
import { ThemeScript } from "@/components/ThemeScript";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ensureBaseSettings, getSetting } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZEROVPN",
  description: "Легальный VPN-доступ с ручной оплатой и личным кабинетом"
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await ensureBaseSettings();
  const siteName = await getSetting("site_name");
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeScript />
        <div className="min-h-screen">
          <Header siteName={siteName || "ZEROVPN"} />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
