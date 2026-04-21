import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthPayload, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  enabledModules: z.array(z.string()).min(1).optional(),
  requiredFields: z.array(z.string()).min(1).optional(),
  workflowFlags: z.record(z.boolean()).optional(),
  businessType: z.string().min(2).optional()
});

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthPayload(req);
    const config = await prisma.tenantTemplateConfig.findUnique({
      where: { tenantId: auth.tenantId }
    });

    if (!config) {
      return NextResponse.json({ error: "Template config not found" }, { status: 404 });
    }
    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthPayload(req);
    requireRole(auth, [UserRole.OWNER, UserRole.MANAGER]);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const config = await prisma.tenantTemplateConfig.update({
      where: { tenantId: auth.tenantId },
      data: {
        enabledModules: parsed.data.enabledModules,
        requiredFields: parsed.data.requiredFields,
        workflowFlags: parsed.data.workflowFlags,
        businessType: parsed.data.businessType
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
