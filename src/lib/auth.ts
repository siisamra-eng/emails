import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "carbinox_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 30;

function signature(expiresAt: string, secret: string) {
  return createHmac("sha256", secret).update(`carbinox:${expiresAt}`).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function isAuthenticated(request: Request) {
  if (!process.env.APP_PASSWORD && process.env.VERCEL !== "1") return true;
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return false;

  const session = request.headers.get("cookie")?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!session) return false;

  const [expiresAt, suppliedSignature] = session.split(".");
  if (!expiresAt || !suppliedSignature || !/^\d+$/.test(expiresAt) || Number(expiresAt) <= Date.now()) return false;
  if (Number(expiresAt) > Date.now() + sessionLifetimeSeconds * 1000) return false;
  return safeEqual(suppliedSignature, signature(expiresAt, secret));
}

export function createSessionCookie(request: Request) {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return null;
  const expiresAt = String(Date.now() + sessionLifetimeSeconds * 1000);
  const value = `${expiresAt}.${signature(expiresAt, secret)}`;
  const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https" ? "; Secure" : "";
  return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionLifetimeSeconds}${secure}`;
}

export function verifyAppPassword(value: unknown) {
  const expected = process.env.APP_PASSWORD;
  return typeof value === "string" && Boolean(expected) && safeEqual(value, expected!);
}
