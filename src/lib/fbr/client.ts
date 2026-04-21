type FbrInvoiceLine = {
  itemCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

type FbrInvoicePayload = {
  invoiceNumber: string;
  invoiceDate: string;
  buyerNTN?: string;
  buyerCNIC?: string;
  lines: FbrInvoiceLine[];
};

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "x-client-id": process.env.FBR_CLIENT_ID ?? "",
    "x-client-secret": process.env.FBR_CLIENT_SECRET ?? ""
  };
}

export async function sendInvoiceToFbr(payload: FbrInvoicePayload) {
  const baseUrl = process.env.FBR_API_BASE_URL ?? "";
  if (!baseUrl) {
    throw new Error("FBR_API_BASE_URL is missing");
  }

  const response = await fetch(`${baseUrl}/invoices`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`FBR invoice upload failed: ${response.status} ${text}`);
  }

  return response.json();
}

export function calculateInvoiceTax(lines: FbrInvoiceLine[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const tax = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice * (l.taxRate / 100), 0);
  return { subtotal, tax, total: subtotal + tax };
}
