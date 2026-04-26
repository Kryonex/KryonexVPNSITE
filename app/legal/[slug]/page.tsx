import { Card } from "@/components/ui";

const pages: Record<string, { title: string; body: string }> = {
  privacy: { title: "Политика конфиденциальности", body: "ZEROVPN хранит только данные, необходимые для аккаунта, оплаты, подписки и поддержки. Секреты интеграций шифруются. Мы не продаём персональные данные." },
  terms: { title: "Пользовательское соглашение", body: "Сервис предоставляется для законного VPN-доступа. Пользователь отвечает за соблюдение применимого законодательства и правил сервиса." },
  refund: { title: "Политика возврата", body: "Возвраты рассматриваются через тикет поддержки. Ручные переводы проверяются администратором." },
  "acceptable-use": { title: "Законное использование", body: "Запрещены вредоносная активность, фишинг, кража данных, обход авторизации, эксплуатация уязвимостей и несанкционированный доступ." }
};

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug] || pages.terms;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Card>
        <h1 className="text-4xl font-semibold">{page.title}</h1>
        <p className="mt-6 leading-7 text-ink/75 dark:text-paper/75">{page.body}</p>
      </Card>
    </div>
  );
}
