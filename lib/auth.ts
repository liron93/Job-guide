import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "fallback-dev-secret-change-me");

export async function createSession(name: string): Promise<string> {
  return new SignJWT({ authenticated: true, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export const getSession = cache(async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return false;
  return verifySession(token);
});
