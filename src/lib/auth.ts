import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";

import { verifyAccessToken, type AppJwtPayload } from "@/lib/security";

export async function getAuthPayload(req: NextRequest): Promise<AppJwtPayload> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing authorization token");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  return verifyAccessToken(token);
}

export function requireRole(payload: AppJwtPayload, allowed: UserRole[]) {
  if (!allowed.includes(payload.role as UserRole)) {
    throw new Error("Forbidden");
  }
}
