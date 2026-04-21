type SaleLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate: number;
};

export function calculateOrderTotals(lines: SaleLine[]) {
  let subtotal = 0;
  let discount = 0;
  let taxTotal = 0;
  let grandTotal = 0;

  const normalizedLines = lines.map((line) => {
    const lineBase = line.quantity * line.unitPrice;
    const lineDiscount = line.discount ?? 0;
    const taxable = Math.max(0, lineBase - lineDiscount);
    const lineTax = taxable * (line.taxRate / 100);
    const lineTotal = taxable + lineTax;

    subtotal += lineBase;
    discount += lineDiscount;
    taxTotal += lineTax;
    grandTotal += lineTotal;

    return {
      ...line,
      discount: lineDiscount,
      taxAmount: lineTax,
      lineTotal
    };
  });

  return { subtotal, discount, taxTotal, grandTotal, lines: normalizedLines };
}
