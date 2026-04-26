import crypto from "crypto";

const algorithm = "aes-256-gcm";

function keyBuffer() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not configured");
  const key = raw.length === 64 ? Buffer.from(raw, "hex") : crypto.createHash("sha256").update(raw).digest();
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must resolve to 32 bytes");
  return key;
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, keyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string) {
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error("Invalid encrypted payload");
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64")), decipher.final()]).toString("utf8");
}

export function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/(token|password|secret|authorization)=?[^,\s]+/gi, "$1=***");
}
