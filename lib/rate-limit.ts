import { prisma } from "@/lib/db";

export async function assertEmailCodeRateLimit(email: string, ip?: string | null) {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const recent = await prisma.emailLoginCode.count({
    where: {
      email,
      createdAt: { gte: since },
      ...(ip ? { ip } : {})
    }
  });
  if (recent >= 5) {
    throw new Error("Слишком много попыток. Попробуйте позже.");
  }
}
