import { InvoiceSyncStatus, OrderStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getAuthPayload, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await getAuthPayload(req);
    requireRole(auth, [UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT]);
    const { orderId } = await ctx.params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId: auth.tenantId },
      include: { invoice: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status !== OrderStatus.PAID) {
      return NextResponse.json({ error: "Only paid orders can be invoiced" }, { status: 409 });
    }
    if (order.invoice) {
      return NextResponse.json(order.invoice);
    }

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: auth.tenantId,
        orderId: order.id,
        invoiceNo: `INV-${Date.now()}`,
        invoiceDate: new Date(),
        fbrSyncStatus: InvoiceSyncStatus.NOT_SYNCED
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
