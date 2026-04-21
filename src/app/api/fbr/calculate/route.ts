import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { calculateInvoiceTax } from "@/lib/fbr/client";

const lineSchema = z.object({
  itemCode: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().nonnegative()
});

const payloadSchema = z.object({
  lines: z.array(lineSchema).min(1)
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const totals = calculateInvoiceTax(parsed.data.lines);
  return NextResponse.json(totals);
}
