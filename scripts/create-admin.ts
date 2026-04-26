import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.FIRST_ADMIN_EMAIL;
  const password = process.env.FIRST_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD are required");
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { role: "OWNER", passwordHash: await bcrypt.hash(password, 12) },
    create: { email: email.toLowerCase(), role: "OWNER", passwordHash: await bcrypt.hash(password, 12) }
  });
}

main().finally(async () => prisma.$disconnect());
