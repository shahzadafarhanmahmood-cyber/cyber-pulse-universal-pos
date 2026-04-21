import { AuditAction, InvoiceSyncStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getAuthPayload, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { sendInvoiceToFbr } from "@/lib/fbr/client";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await getAuthPayload(req);
    requireRole(auth, [UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT]);
    const { invoiceId } = await ctx.params;

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: auth.tenantId },
      include: {
        order: {
          include: {
            items: {
              include: { product: true }
            }
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const payload = {
      invoiceNumber: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate.toISOString(),
      lines: invoice.order.items.map((item) => ({
        itemCode: item.product.sku,
        description: item.product.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate)
      }))
    };

    try {
      const response = await sendInvoiceToFbr(payload);
      const fbrRef = String(
        (response as Record<string, unknown>).reference ??
          (response as Record<string, unknown>).invoiceRef ??
          "FBR-ACK"
      );

      const updated = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          fbrSyncStatus: InvoiceSyncStatus.SYNCED,
          fbrInvoiceRef: fbrRef,
          fbrSyncMessage: "Synced successfully"
        }
      });

      await prisma.integrationSetting.updateMany({
        where: { tenantId: auth.tenantId, provider: "FBR" },
        data: { lastSyncAt: new Date() }
      });

      await logAuditEvent({
        tenantId: auth.tenantId,
        userId: auth.userId,
        action: AuditAction.FBR_SYNC,
        entity: "Invoice",
        entityId: invoice.id,
        metadata: { status: "SYNCED", fbrReference: fbrRef }
      });

      return NextResponse.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "FBR sync failed";

      const failed = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          fbrSyncStatus: InvoiceSyncStatus.FAILED,
          fbrSyncMessage: message
        }
      });

      await logAuditEvent({
        tenantId: auth.tenantId,
        userId: auth.userId,
        action: AuditAction.FBR_SYNC,
        entity: "Invoice",
        entityId: invoice.id,
        metadata: { status: "FAILED", reason: message }
      });

      return NextResponse.json(failed, { status: 502 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
