export const modules = ["FI", "MM", "SD", "PP", "WM"] as const;
export const severities = ["H", "M", "L"] as const;
export const statuses = ["open", "in_review", "resolved"] as const;

export type Module = (typeof modules)[number];
export type Severity = (typeof severities)[number];
export type Status = (typeof statuses)[number];

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
