import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

const encoder = new TextEncoder();
const jwtSecret = process.env.JWT_SECRET ?? "unsafe-dev-secret-change-me";

export type AppJwtPayload = {
  userId: string;
  tenantId: string;
  role: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAccessToken(payload: AppJwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(encoder.encode(jwtSecret));
}

export async function signRefreshToken(payload: AppJwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encoder.encode(jwtSecret));
}

export async function verifyAccessToken(token: string): Promise<AppJwtPayload> {
  const verified = await jwtVerify(token, encoder.encode(jwtSecret));
  return verified.payload as AppJwtPayload;
}

export async function verifyRefreshToken(token: string): Promise<AppJwtPayload> {
  const verified = await jwtVerify(token, encoder.encode(jwtSecret));
  return verified.payload as AppJwtPayload;
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function enforceStrongPassword(password: string): boolean {
  const minLength = password.length >= 10;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
}
