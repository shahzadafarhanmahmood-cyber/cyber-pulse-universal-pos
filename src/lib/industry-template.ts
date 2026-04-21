export type TenantTemplateShape = {
  templateKey: string;
  businessType: string;
  enabledModules: string[];
  requiredFields: string[];
  workflowFlags: Record<string, boolean>;
};

type TemplateOverride = {
  enabledModules?: string[];
  requiredFields?: string[];
  workflowFlags?: Record<string, boolean>;
};

const BASE_MODULES = ["catalog", "inventory", "sales", "payments", "invoicing", "reporting"];

export function buildIndustryTemplate(
  businessType?: string,
  override?: TemplateOverride
): TenantTemplateShape {
  const selected: TenantTemplateShape = {
    templateKey: "universal-default",
    businessType: businessType?.trim() || "GENERAL",
    enabledModules: [...BASE_MODULES],
    requiredFields: ["invoice.invoiceNo"],
    workflowFlags: {
      enableKitchenTickets: false,
      enablePatientVisits: false,
      enableBatchExpiryChecks: false,
      enableSplitBill: false,
      requireServiceReference: false
    }
  };

  return {
    templateKey: selected.templateKey,
    businessType: selected.businessType,
    enabledModules: override?.enabledModules ?? selected.enabledModules,
    requiredFields: override?.requiredFields ?? selected.requiredFields,
    workflowFlags: override?.workflowFlags ?? selected.workflowFlags
  };
}
