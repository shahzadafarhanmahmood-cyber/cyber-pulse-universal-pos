"use client";

import { FormEvent, useMemo, useState } from "react";

type TemplateConfig = {
  id: string;
  tenantId: string;
  templateKey: string;
  businessType: string;
  enabledModules: string[];
  requiredFields: string[];
  workflowFlags: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
};

function parseCsv(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function TemplateAdminPage() {
  const [token, setToken] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [modulesCsv, setModulesCsv] = useState("");
  const [requiredFieldsCsv, setRequiredFieldsCsv] = useState("");
  const [workflowFlagsJson, setWorkflowFlagsJson] = useState('{\n  "enableReturns": true\n}');
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const hasToken = useMemo(() => token.trim().length > 0, [token]);

  async function loadTemplateConfig() {
    if (!hasToken) {
      setErrorMessage("Access token is required.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const res = await fetch("/api/settings/template", {
        headers: {
          Authorization: `Bearer ${token.trim()}`
        }
      });
      const data = (await res.json()) as TemplateConfig | { error?: string };
      if (!res.ok) {
        throw new Error("error" in data ? data.error || "Failed to load template config." : "Request failed.");
      }

      const config = data as TemplateConfig;
      setTemplateConfig(config);
      setBusinessType(config.businessType || "");
      setModulesCsv((config.enabledModules || []).join(", "));
      setRequiredFieldsCsv((config.requiredFields || []).join(", "));
      setWorkflowFlagsJson(JSON.stringify(config.workflowFlags || {}, null, 2));
      setStatusMessage("Template config loaded.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load template config.");
    } finally {
      setLoading(false);
    }
  }

  async function updateTemplateConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasToken) {
      setErrorMessage("Access token is required.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const workflowFlags = JSON.parse(workflowFlagsJson) as Record<string, boolean>;
      const payload = {
        businessType: businessType.trim(),
        enabledModules: parseCsv(modulesCsv),
        requiredFields: parseCsv(requiredFieldsCsv),
        workflowFlags
      };

      const res = await fetch("/api/settings/template", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.trim()}`
        },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as TemplateConfig | { error?: string };
      if (!res.ok) {
        throw new Error("error" in data ? data.error || "Failed to update template config." : "Request failed.");
      }

      const config = data as TemplateConfig;
      setTemplateConfig(config);
      setStatusMessage("Template config updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update config. Ensure workflowFlags is valid JSON."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ margin: "2rem auto", maxWidth: 900, fontFamily: "Arial, sans-serif" }}>
      <h1>Template Admin</h1>
      <p>Manage universal business configuration for your tenant.</p>

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <label htmlFor="accessToken">Access Token</label>
        <input
          id="accessToken"
          type="password"
          placeholder="Paste access token from /api/auth/login"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button
          type="button"
          onClick={loadTemplateConfig}
          disabled={loading}
          style={{ width: 220, padding: "10px 14px", cursor: "pointer" }}
        >
          {loading ? "Loading..." : "Load Template Config"}
        </button>
      </div>

      <form onSubmit={updateTemplateConfig} style={{ display: "grid", gap: 12 }}>
        <label htmlFor="businessType">Business Type</label>
        <input
          id="businessType"
          value={businessType}
          onChange={(event) => setBusinessType(event.target.value)}
          placeholder="GENERAL / PHARMACY / SALON / WORKSHOP / etc."
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />

        <label htmlFor="enabledModules">Enabled Modules (comma-separated)</label>
        <input
          id="enabledModules"
          value={modulesCsv}
          onChange={(event) => setModulesCsv(event.target.value)}
          placeholder="catalog, inventory, sales, payments, invoicing, reporting"
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />

        <label htmlFor="requiredFields">Required Fields (comma-separated)</label>
        <input
          id="requiredFields"
          value={requiredFieldsCsv}
          onChange={(event) => setRequiredFieldsCsv(event.target.value)}
          placeholder="invoice.invoiceNo, customer.name"
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />

        <label htmlFor="workflowFlags">Workflow Flags (JSON)</label>
        <textarea
          id="workflowFlags"
          value={workflowFlagsJson}
          onChange={(event) => setWorkflowFlagsJson(event.target.value)}
          rows={10}
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontFamily: "Consolas, monospace" }}
        />

        <button type="submit" disabled={loading} style={{ width: 220, padding: "10px 14px", cursor: "pointer" }}>
          {loading ? "Saving..." : "Save Template Config"}
        </button>
      </form>

      {statusMessage ? <p style={{ color: "green", marginTop: 12 }}>{statusMessage}</p> : null}
      {errorMessage ? <p style={{ color: "crimson", marginTop: 12 }}>{errorMessage}</p> : null}

      {templateConfig ? (
        <section style={{ marginTop: 24 }}>
          <h2>Current Config Snapshot</h2>
          <pre
            style={{
              background: "#111",
              color: "#f3f3f3",
              padding: 14,
              borderRadius: 8,
              overflowX: "auto",
              fontSize: 12
            }}
          >
            {JSON.stringify(templateConfig, null, 2)}
          </pre>
        </section>
      ) : null}
    </main>
  );
}
