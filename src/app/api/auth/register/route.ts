import { AuditAction, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { buildIndustryTemplate } from "@/lib/industry-template";
import { enforceStrongPassword, hashPassword } from "@/lib/security";

const payloadSchema = z.object({
  tenantName: z.string().min(2),
  businessType: z.string().min(2).default("GENERAL"),
  templateOverride: z
    .object({
      enabledModules: z.array(z.string()).min(1).optional(),
      requiredFields: z.array(z.string()).min(1).optional(),
      workflowFlags: z.record(z.boolean()).optional()
    })
    .optional(),
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(10)
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!enforceStrongPassword(parsed.data.password)) {
    return NextResponse.json(
      { error: "Password must include upper, lower, number, special character." },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const template = buildIndustryTemplate(
    parsed.data.businessType,
    parsed.data.templateOverride
  );

  const tenant = await prisma.tenant.create({
    data: {
      name: parsed.data.tenantName,
      businessType: parsed.data.businessType,
      templateConfig: {
        create: {
          templateKey: template.templateKey,
          businessType: template.businessType,
          enabledModules: template.enabledModules,
          requiredFields: template.requiredFields,
          workflowFlags: template.workflowFlags
        }
      },
      users: {
        create: {
          fullName: parsed.data.ownerName,
          email: parsed.data.email,
          passwordHash,
          role: UserRole.OWNER
        }
      }
    },
    include: { users: true, templateConfig: true }
  });

  await logAuditEvent({
    tenantId: tenant.id,
    userId: tenant.users[0]?.id,
    action: AuditAction.LOGIN,
    entity: "Tenant",
    entityId: tenant.id,
    metadata: { event: "owner_registered" }
  });

  return NextResponse.json({
    tenantId: tenant.id,
    userId: tenant.users[0]?.id,
    templateConfig: tenant.templateConfig
  });
}
