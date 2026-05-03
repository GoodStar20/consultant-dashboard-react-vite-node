import type { GapRecord, SummaryPayload } from "./types";

const API_BASE = "http://localhost:4000";

const withTenant = (tenantId: string): HeadersInit => ({
  "x-tenant-id": tenantId,
  "content-type": "application/json"
});

export interface GapQuery {
  severity?: string;
  module?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortDir?: string;
}

const toQuery = (query: GapQuery) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
};

export const fetchGaps = async (tenantId: string, query: GapQuery): Promise<GapRecord[]> => {
  const qs = toQuery(query);
  const url = `${API_BASE}/gaps${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: withTenant(tenantId) });
  if (!res.ok) throw new Error("Failed to fetch gaps");
  const data = (await res.json()) as { items: GapRecord[] };
  return data.items;
};

export const fetchSummary = async (tenantId: string): Promise<SummaryPayload> => {
  const res = await fetch(`${API_BASE}/summary`, { headers: withTenant(tenantId) });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return (await res.json()) as SummaryPayload;
};

export const patchAnnotation = async (
  tenantId: string,
  id: string,
  annotation: string
): Promise<GapRecord> => {
  const res = await fetch(`${API_BASE}/gaps/${id}`, {
    method: "PATCH",
    headers: withTenant(tenantId),
    body: JSON.stringify({ annotation })
  });
  if (!res.ok) throw new Error("Failed to save annotation");
  return (await res.json()) as GapRecord;
};
