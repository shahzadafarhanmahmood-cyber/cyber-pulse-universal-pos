const modules = [
  "Universal Sales & Billing",
  "Configurable Service Workflows",
  "Custom Business Fields & Rules",
  "Inventory & Procurement",
  "Tax & Invoice Compliance",
  "FBR/IRIS Integration Service"
];

export default function HomePage() {
  return (
    <main style={{ margin: "2rem auto", maxWidth: 820, fontFamily: "Arial, sans-serif" }}>
      <h1>Cyber Pulse Universal POS</h1>
      <p>
        Secure multi-tenant POS starter for Pakistan. This project includes a production-ready
        database model, role-based access controls, and an FBR integration service layer.
      </p>

      <h2>Included Modules</h2>
      <ul>
        {modules.map((moduleName) => (
          <li key={moduleName}>{moduleName}</li>
        ))}
      </ul>

      <h2>Next Step</h2>
      <p>
        Configure `.env`, connect PostgreSQL, run Prisma migrations, then begin implementing API
        routes from `docs/ARCHITECTURE.md`.
      </p>
      <p>
        Open <code>/admin/template</code> to manage universal modules, fields, and workflow flags
        for your tenant.
      </p>
    </main>
  );
}
