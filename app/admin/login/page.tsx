"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/actions";
import { Card, Input } from "@/components/ui";

export default function AdminLoginPage() {
  const [state, action] = useActionState(adminLogin, null);
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12">
      <Card className="w-full">
        <h1 className="text-3xl font-semibold">Админ-вход</h1>
        <form action={action} className="mt-6 space-y-3">
          <Input name="email" type="email" placeholder="admin@example.com" required />
          <Input name="password" type="password" placeholder="Пароль" required />
          <button className="h-10 rounded-md bg-ink px-4 text-paper dark:bg-paper dark:text-ink">Войти</button>
          {state?.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
        </form>
      </Card>
    </div>
  );
}
