import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { axe } from "jest-axe";
import App from "./App";

vi.mock("./api", () => ({
  fetchGaps: vi.fn(async () => [
    {
      id: "gap-1",
      scope_item: "Invoice automation",
      module: "FI",
      gap_type: "Missing config",
      severity: "H",
      score: 88,
      customer_name: "Northwind 1",
      tenant_id: "tenant-alpha",
      created_at: new Date().toISOString(),
      status: "open",
      annotation: ""
    }
  ]),
  fetchSummary: vi.fn(async () => ({
    severity: { H: 1, M: 0, L: 0 },
    module: { FI: 1, MM: 0, SD: 0, PP: 0, WM: 0 },
    scope: { "Invoice automation": 1 }
  })),
  patchAnnotation: vi.fn(async () => ({}))
}));

describe("app", () => {
  it("renders table and has no critical a11y issues", async () => {
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole("grid", { name: "Gap table" })).toBeInTheDocument();
    const results = await axe(container);
    expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });
});
