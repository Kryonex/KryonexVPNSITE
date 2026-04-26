"use client";

import { useActionState } from "react";
import { sendLoginCode, verifyLoginCode } from "@/app/actions";
import { Card, Input } from "@/components/ui";

export default function LoginPage() {
  const [sendState, sendAction] = useActionState(sendLoginCode, null);
  const [verifyState, verifyAction] = useActionState(verifyLoginCode, null);
  const email = sendState?.email || verifyState?.email || "";
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 py-12">
      <Card className="w-full">
        <h1 className="text-3xl font-semibold">Вход по email-коду</h1>
        <form action={sendAction} className="mt-6 space-y-3">
          <Input name="email" type="email" placeholder="email@example.com" defaultValue={email} required />
          <button className="h-10 rounded-md bg-ink px-4 text-paper dark:bg-paper dark:text-ink">Получить код</button>
          {sendState?.message ? <p className="text-sm text-matcha">{sendState.message}</p> : null}
        </form>
        <form action={verifyAction} className="mt-6 space-y-3 border-t border-ink/10 pt-6 dark:border-white/10">
          <Input name="email" type="email" placeholder="email@example.com" defaultValue={email} required />
          <Input name="code" inputMode="numeric" placeholder="6 цифр" required />
          <button className="h-10 rounded-md bg-matcha px-4 text-white">Войти</button>
          {verifyState?.message ? <p className="text-sm text-rose-600">{verifyState.message}</p> : null}
        </form>
      </Card>
    </div>
  );
}
