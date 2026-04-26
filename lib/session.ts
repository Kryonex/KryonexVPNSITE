import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";

const cookieName = "zerovpn_session";

type SessionPayload = {
  sub: string;
  role: UserRole;
  exp: number;
};

function secret() {
  const value = process.env.AUTH_SECRET || process.env.APP_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return value;
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string) {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export async function createSession(userId: string, role: UserRole) {
  const payload: SessionPayload = {
    sub: userId,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  };
  const body = base64url(JSON.stringify(payload));
  const token = `${body}.${sign(body)}`;
  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.isBlocked) return null;
  return user;
}

export async function requireUser() {
  const user = await getSession();
  if (!user) throw new Error("AUTH_REQUIRED");
  return user;
}

export async function requireAdmin(roles: UserRole[] = ["OWNER", "ADMIN", "SUPPORT"]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error("ADMIN_REQUIRED");
  return user;
}
