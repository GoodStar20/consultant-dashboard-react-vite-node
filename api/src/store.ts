import { seedData } from "./data.js";
import { GapRecord, Module, Severity, Status } from "./types.js";

export interface GapFilters {
  severity?: Severity;
  module?: Module;
  status?: Status;
  search?: string;
  sortBy?: "created_at" | "score" | "severity";
  sortDir?: "asc" | "desc";
}

const severityRank: Record<Severity, number> = { H: 3, M: 2, L: 1 };

export class GapStore {
  private readonly rows: GapRecord[] = seedData();

  list(tenantId: string, filters: GapFilters): GapRecord[] {
    let data = this.rows.filter((row) => row.tenant_id === tenantId);
    if (filters.severity) data = data.filter((row) => row.severity === filters.severity);
    if (filters.module) data = data.filter((row) => row.module === filters.module);
    if (filters.status) data = data.filter((row) => row.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      data = data.filter((row) => row.customer_name.toLowerCase().includes(q));
    }

    const sortBy = filters.sortBy ?? "created_at";
    const sortDir = filters.sortDir ?? "desc";
    data = [...data].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "score") return (a.score - b.score) * dir;
      if (sortBy === "severity") return (severityRank[a.severity] - severityRank[b.severity]) * dir;
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    });
    return data;
  }

  getById(id: string, tenantId: string): GapRecord | undefined {
    return this.rows.find((row) => row.id === id && row.tenant_id === tenantId);
  }

  updateAnnotation(id: string, tenantId: string, annotation: string): GapRecord | undefined {
    const row = this.rows.find((record) => record.id === id && record.tenant_id === tenantId);
    if (!row) return undefined;
    row.annotation = annotation;
    return row;
  }

  summary(tenantId: string): {
    severity: Record<Severity, number>;
    module: Record<Module, number>;
    scope: Record<string, number>;
  } {
    const data = this.rows.filter((row) => row.tenant_id === tenantId);
    const severity = { H: 0, M: 0, L: 0 };
    const module: Record<Module, number> = { FI: 0, MM: 0, SD: 0, PP: 0, WM: 0 };
    const scope: Record<string, number> = {};
    for (const row of data) {
      severity[row.severity] += 1;
      module[row.module] += 1;
      scope[row.scope_item] = (scope[row.scope_item] ?? 0) + 1;
    }
    return { severity, module, scope };
  }
}
