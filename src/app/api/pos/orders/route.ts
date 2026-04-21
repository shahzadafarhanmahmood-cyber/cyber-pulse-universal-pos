import { AuditAction, OrderStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthPayload, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { calculateOrderTotals } from "@/lib/pos";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative()
});

const createOrderSchema = z.object({
  locationId: z.string().min(1),
  customerId: z.string().optional(),
  items: z.array(itemSchema).min(1)
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthPayload(req);
    requireRole(auth, [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER]);

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const orderNo = `ORD-${Date.now()}`;
    const totals = calculateOrderTotals(parsed.data.items);

    const order = await prisma.order.create({
      data: {
        tenantId: auth.tenantId,
        locationId: parsed.data.locationId,
        customerId: parsed.data.customerId,
        orderNo,
        status: OrderStatus.OPEN,
        subtotal: totals.subtotal,
        discount: totals.discount,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal,
        items: {
          create: totals.lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            taxRate: line.taxRate,
            taxAmount: line.taxAmount,
            lineTotal: line.lineTotal
          }))
        }
      },
      include: { items: true }
    });

    await logAuditEvent({
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: AuditAction.CREATE_ORDER,
      entity: "Order",
      entityId: order.id,
      metadata: { orderNo: order.orderNo }
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
