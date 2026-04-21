import { AuditAction, OrderStatus, PaymentMethod, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthPayload, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive(),
  referenceNo: z.string().optional()
});

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await getAuthPayload(req);
    requireRole(auth, [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER]);

    const { orderId } = await ctx.params;
    const body = await req.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId: auth.tenantId }
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status === OrderStatus.PAID) {
      return NextResponse.json({ error: "Order already paid" }, { status: 409 });
    }

    if (parsed.data.amount < Number(order.grandTotal)) {
      return NextResponse.json({ error: "Paid amount is less than grand total" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          method: parsed.data.method,
          amount: parsed.data.amount,
          referenceNo: parsed.data.referenceNo
        }
      });

      const paidOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID }
      });

      return { payment, order: paidOrder };
    });

    await logAuditEvent({
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: AuditAction.PAY_ORDER,
      entity: "Order",
      entityId: order.id,
      metadata: { paymentMethod: parsed.data.method, amount: parsed.data.amount }
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
