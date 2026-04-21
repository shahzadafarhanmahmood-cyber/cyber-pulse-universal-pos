import { AuditAction } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import {
  sha256,
  signAccessToken,
  signRefreshToken,
  verifyPassword
} from "@/lib/security";

const payloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const payload = { userId: user.id, tenantId: user.tenantId, role: user.role };
  const accessToken = await signAccessToken(payload);
  const refreshToken = await signRefreshToken(payload);
  const refreshHash = sha256(refreshToken);

  await prisma.refreshToken.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  await logAuditEvent({
    tenantId: user.tenantId,
    userId: user.id,
    action: AuditAction.LOGIN,
    entity: "User",
    entityId: user.id
  });

  return NextResponse.json({ accessToken, refreshToken });
}
