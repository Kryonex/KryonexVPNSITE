"use client";

import { useActionState } from "react";
import { setupInstall } from "@/app/actions";
import { Card, Input, Select } from "@/components/ui";

export default function SetupPage() {
  const [state, action] = useActionState(setupInstall, null);
  return (
    <div className="mx-auto grid min-h-[75vh] max-w-xl place-items-center px-4 py-12">
      <Card className="w-full">
        <h1 className="text-3xl font-semibold">Первичная настройка ZEROVPN</h1>
        <form action={action} className="mt-6 grid gap-3">
          <Input name="siteName" defaultValue="ZEROVPN" placeholder="Название сервиса" required />
          <Input name="adminEmail" type="email" placeholder="Email первого админа" required />
          <Input name="adminPassword" type="password" placeholder="Пароль первого админа" required />
          <Input name="paymentPhone" placeholder="Телефон для оплаты" required />
          <Input name="supportTelegram" placeholder="Telegram поддержки" />
          <Input name="trialDays" type="number" defaultValue="3" placeholder="Trial days" />
          <Input name="pasarguardBaseUrl" placeholder="https://panel.example.com:8000" />
          <Select name="pasarguardMode" defaultValue="mock"><option value="mock">Mock</option><option value="production">Production</option></Select>
          <button className="rounded-md bg-ink px-4 py-3 font-medium text-paper dark:bg-paper dark:text-ink">Завершить настройку</button>
          {state?.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
        </form>
      </Card>
    </div>
  );
}
