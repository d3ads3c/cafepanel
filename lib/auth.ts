import crypto from "crypto";
import { cookies } from "next/headers";

const DEFAULT_EXP_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret =
    process.env.AUTH_SECRET || process.env.DB_PASSWORD || "dev_secret";
  return secret;
}

export type AuthPayload = {
  userId: number;
  username: string;
  plan: string;
  cafename: string;
  permissions: string[] | string | number; // Can be array, comma-separated string, or 0 for all permissions
  exp: number;
};

export function signPayload(
  payload: Omit<AuthPayload, "exp">,
  expMs: number = DEFAULT_EXP_MS
): string {
  const exp = Date.now() + expMs;
  const data = { ...payload, exp };
  const json = JSON.stringify(data);
  const b64 = Buffer.from(json).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(b64)
    .digest("base64url");
  return `${b64}.${hmac}`;
}

export function verifyToken(
  token: string | undefined | null
): AuthPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(b64)
    .digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return null;
  try {
    const json = Buffer.from(b64, "base64url").toString("utf8");
    const data = JSON.parse(json) as AuthPayload;
    if (Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  (await cookies()).set("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  (await cookies()).set("LoggedUser", "", { path: "/", maxAge: 0 });
}

export async function getAuth(): Promise<AuthPayload | null> {
  const token = (await cookies()).get("LoggedUser")?.value;
  return verifyToken(token);
}
