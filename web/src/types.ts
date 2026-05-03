export type Module = "FI" | "MM" | "SD" | "PP" | "WM";
export type Severity = "H" | "M" | "L";
export type Status = "open" | "in_review" | "resolved";

export interface GapRecord {
  id: string;
  scope_item: string;
  module: Module;
  gap_type: string;
  severity: Severity;
  score: number;
  customer_name: string;
  tenant_id: string;
  created_at: string;
  status: Status;
  annotation: string;
}

export interface SummaryPayload {
  severity: Record<Severity, number>;
  module: Record<Module, number>;
  scope: Record<string, number>;
}
