import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sha256, signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/security";

const payloadSchema = z.object({
  refreshToken: z.string().min(20)
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const tokenHash = sha256(parsed.data.refreshToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return NextResponse.json({ error: "Refresh token is invalid or expired" }, { status: 401 });
  }

  const payload = await verifyRefreshToken(parsed.data.refreshToken);
  const newAccess = await signAccessToken(payload);
  const newRefresh = await signRefreshToken(payload);
  const newRefreshHash = sha256(newRefresh);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() }
    }),
    prisma.refreshToken.create({
      data: {
        tenantId: payload.tenantId,
        userId: payload.userId,
        tokenHash: newRefreshHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })
  ]);

  return NextResponse.json({ accessToken: newAccess, refreshToken: newRefresh });
}
