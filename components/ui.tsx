import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(clsx(inputs));
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-ink/10 bg-white/65 p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.06]", className)} {...props} />;
}

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-medium text-paper transition hover:opacity-90 dark:bg-paper dark:text-ink", className)} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="h-10 w-full rounded-md border border-ink/15 bg-white/80 px-3 text-sm outline-none focus:border-matcha dark:border-white/15 dark:bg-white/10" {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="min-h-28 w-full rounded-md border border-ink/15 bg-white/80 px-3 py-2 text-sm outline-none focus:border-matcha dark:border-white/15 dark:bg-white/10" {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="h-10 w-full rounded-md border border-ink/15 bg-white/80 px-3 text-sm outline-none focus:border-matcha dark:border-white/15 dark:bg-white/10" {...props} />;
}
