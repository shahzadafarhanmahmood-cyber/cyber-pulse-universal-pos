import { AuditAction } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { sha256, verifyRefreshToken } from "@/lib/security";

const payloadSchema = z.object({
  refreshToken: z.string().min(20)
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = await verifyRefreshToken(parsed.data.refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(parsed.data.refreshToken), revokedAt: null },
    data: { revokedAt: new Date() }
  });

  await logAuditEvent({
    tenantId: payload.tenantId,
    userId: payload.userId,
    action: AuditAction.LOGOUT,
    entity: "User",
    entityId: payload.userId
  });

  return NextResponse.json({ ok: true });
}
