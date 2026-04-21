import { AuditAction, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type AuditInput = {
  tenantId: string;
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function logAuditEvent(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata
    }
  });
}
