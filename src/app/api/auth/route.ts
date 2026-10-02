import { createSessionCookie, isAuthenticated, verifyAppPassword } from "@/lib/auth";

export async function GET(request: Request) {
  return Response.json({ authenticated: await isAuthenticated(request), configured: Boolean(process.env.APP_PASSWORD && process.env.APP_SESSION_SECRET) });
}

export async function POST(request: Request) {
  if (!process.env.APP_PASSWORD || !process.env.APP_SESSION_SECRET) {
    return Response.json({ error: "App access isn't configured. Set APP_PASSWORD and APP_SESSION_SECRET on the server." }, { status: 503 });
  }

  let password: unknown;
  try {
    password = (await request.json() as { password?: unknown }).password;
  } catch {
    return Response.json({ error: "Enter the workspace password." }, { status: 400 });
  }

  if (!verifyAppPassword(password)) return Response.json({ error: "That password doesn't match." }, { status: 401 });

  const cookie = createSessionCookie(request);
  if (!cookie) return Response.json({ error: "App access isn't configured correctly." }, { status: 503 });
  return Response.json({ authenticated: true }, { headers: { "Set-Cookie": cookie } });
}
