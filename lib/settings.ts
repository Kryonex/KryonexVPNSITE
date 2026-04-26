import { prisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

export type BankSettings = {
  tinkoff: boolean;
  sber: boolean;
  ozon: boolean;
};

const defaults: Record<string, string> = {
  site_name: "ZEROVPN",
  support_telegram: "",
  payment_phone: "",
  payment_instruction_ru: "Переведите точную сумму на номер телефона и нажмите кнопку после оплаты.",
  payment_instruction_en: "Transfer the exact amount to the phone number, then mark the order as paid.",
  enabled_banks: JSON.stringify({ tinkoff: true, sber: true, ozon: true }),
  trial_days: "3",
  pasarguard_mode: "mock",
  pasarguard_base_url: "",
  pasarguard_admin_username: "",
  pasarguard_user_template_id: "",
  smtp_enabled: "false",
  push_enabled: "false",
  default_locale: "ru",
  setup_completed: "false"
};

export async function getSetting(key: string) {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  if (!row) return defaults[key] ?? "";
  return row.encrypted ? decryptSecret(row.value) : row.value;
}

export async function setSetting(key: string, value: string, encrypted = false) {
  return prisma.appSetting.upsert({
    where: { key },
    update: { value: encrypted ? encryptSecret(value) : value, encrypted },
    create: { key, value: encrypted ? encryptSecret(value) : value, encrypted }
  });
}

export async function getSettings(keys: string[]) {
  const entries = await Promise.all(keys.map(async (key) => [key, await getSetting(key)] as const));
  return Object.fromEntries(entries);
}

export async function ensureBaseSettings() {
  await Promise.all(
    Object.entries(defaults).map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        update: {},
        create: { key, value }
      })
    )
  );
  const count = await prisma.serviceStatus.count();
  if (count === 0) {
    await prisma.serviceStatus.create({ data: {} });
  }
}
