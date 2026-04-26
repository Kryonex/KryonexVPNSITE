import { PrismaClient } from "@prisma/client";
import { ensureBaseSettings, setSetting } from "../lib/settings";

const prisma = new PrismaClient();

async function main() {
  await ensureBaseSettings();

  const plans = [
    ["1 месяц", "1 month", 1, 150, 1],
    ["3 месяца", "3 months", 3, 450, 2],
    ["6 месяцев", "6 months", 6, 850, 3],
    ["12 месяцев", "12 months", 12, 1600, 4]
  ] as const;
  for (const [titleRu, titleEn, months, priceRub, sortOrder] of plans) {
    await prisma.plan.upsert({
      where: { id: `seed-plan-${months}` },
      update: { titleRu, titleEn, months, priceRub, sortOrder, isVisible: true },
      create: { id: `seed-plan-${months}`, titleRu, titleEn, months, priceRub, sortOrder, isVisible: true }
    });
  }

  const apps = ["Hiddify", "Streisand", "v2rayN", "Shadowrocket", "Nekoray", "Clash Verge"];
  for (const [index, appName] of apps.entries()) {
    await prisma.instruction.upsert({
      where: { slug: appName.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        appName,
        slug: appName.toLowerCase().replace(/\s+/g, "-"),
        sortOrder: index,
        bodyRu: `1. Установите ${appName}.\n2. Скопируйте subscription URL из кабинета.\n3. Добавьте подписку в приложении.\n4. Обновите профили и подключитесь.`,
        bodyEn: `1. Install ${appName}.\n2. Copy your subscription URL from the account page.\n3. Add it as a subscription.\n4. Refresh profiles and connect.`
      }
    });
  }

  const faqs = [
    ["Как оплатить?", "Выберите тариф, банк и переведите точную сумму на номер телефона. Затем нажмите «Я оплатил»."],
    ["Сколько устройств можно подключить?", "Количество устройств не ограничено, трафик безлимитный."],
    ["Как получить trial?", "Войдите в личный кабинет и активируйте пробный период. Он доступен один раз на email."],
    ["Что делать при ошибке выдачи?", "Откройте тикет. Администратор увидит ошибку PasarGuard и сможет повторить выдачу."]
  ];
  for (const [index, [questionRu, answerRu]] of faqs.entries()) {
    await prisma.faqItem.upsert({
      where: { id: `seed-faq-${index}` },
      update: { questionRu, answerRu },
      create: { id: `seed-faq-${index}`, questionRu, questionEn: questionRu, answerRu, answerEn: answerRu, sortOrder: index }
    });
  }

  await prisma.newsPost.upsert({
    where: { slug: "welcome" },
    update: {},
    create: {
      slug: "welcome",
      titleRu: "ZEROVPN запущен",
      titleEn: "ZEROVPN is live",
      bodyRu: "Мы запустили сайт, личный кабинет, ручную оплату и автоматическую выдачу подписок.",
      bodyEn: "Website, account area, manual payment flow and automatic subscription issuing are live.",
      isPublished: true,
      publishedAt: new Date()
    }
  });

  await prisma.fundraiser.upsert({
    where: { id: "seed-fundraiser-japan" },
    update: {},
    create: {
      id: "seed-fundraiser-japan",
      titleRu: "Сервер в Японии",
      titleEn: "Japan server",
      descriptionRu: "Собираем бюджет на новую локацию в Японии.",
      descriptionEn: "Funding a new Japan location.",
      goalRub: 5000,
      status: "active"
    }
  });

  if (process.env.SEED_SITE_NAME) await setSetting("site_name", process.env.SEED_SITE_NAME);
  if (process.env.SEED_PAYMENT_PHONE) await setSetting("payment_phone", process.env.SEED_PAYMENT_PHONE);
}

main().finally(async () => prisma.$disconnect());
