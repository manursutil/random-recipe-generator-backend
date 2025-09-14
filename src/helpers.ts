import { sign } from "hono/jwt";
import type { CookieOptions } from "hono/utils/cookie";

export const generateToken = async (userId: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    iat: now,
    exp: now + 1 * 60 * 60,
  };
  const token = await sign(payload, secret);
  return token;
};

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax",
  path: "/",
  maxAge: 3600,
} as CookieOptions;
