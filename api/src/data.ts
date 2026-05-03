import { GapRecord, Module, Severity, Status, modules, severities, statuses } from "./types.js";

const gapTypes = [
  "Missing config",
  "Master data mismatch",
  "Custom code dependency",
  "Workflow deviation",
  "Reporting gap"
];

const scopeItems = [
  "Invoice automation",
  "Procurement approval",
  "Order fulfillment",
  "Production planning",
  "Warehouse optimization"
];

const customers = [
  "Northwind",
  "Globex",
  "Initech",
  "Umbrella",
  "Stark Industries",
  "Wayne Enterprises",
  "Soylent",
  "Wonka"
];

const tenants = ["tenant-alpha", "tenant-beta", "tenant-gamma"];

const pick = <T>(arr: readonly T[], n: number): T => arr[n % arr.length];

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const stringToSeed = (value: string): number => {
  // Simple non-crypto hash
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const pickRand = <T>(arr: readonly T[], rand: () => number): T => {
  return arr[Math.floor(rand() * arr.length)]!;
};

export const seedData = (count = 750): GapRecord[] => {
  const rows: GapRecord[] = [];
  const perTenant = Math.ceil(count / tenants.length);

  const now = Date.now();
  let globalIndex = 0;

  for (const tenant of tenants) {
    const tenantSeed = stringToSeed(tenant);

    for (let i = 0; i < perTenant && rows.length < count; i += 1) {
      const rand = mulberry32(tenantSeed + i * 1013);

      const module = pickRand<Module>(modules, rand);
      const severity = pickRand<Severity>(severities, rand);
      const status = pickRand<Status>(statuses, rand);

      const created = new Date(now - globalIndex * 1000 * 60 * 17).toISOString();

      const customerBase = pickRand(customers, rand);
      const customerNum = 1 + Math.floor(rand() * 5);

      rows.push({
        id: `${tenant}-gap-${i + 1}`,
        scope_item: pickRand(scopeItems, rand),
        module,
        gap_type: pickRand(gapTypes, rand),
        severity,
        score: 40 + Math.floor(rand() * 61),
        customer_name: `${customerBase} ${customerNum}`,
        tenant_id: tenant,
        created_at: created,
        status,
        annotation: rand() < 0.12 ? "Needs workshop review." : ""
      });

      globalIndex += 1;
    }
  }

  return rows;
};
