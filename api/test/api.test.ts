import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

const app = buildServer();

beforeAll(async () => {
  await app.ready();
});

describe("gap api", () => {
  it("enforces tenant filtering", async () => {
    const tenantA = await request(app.server).get("/gaps").set("x-tenant-id", "tenant-alpha");
    const tenantB = await request(app.server).get("/gaps").set("x-tenant-id", "tenant-beta");
    expect(tenantA.statusCode).toBe(200);
    expect(tenantB.statusCode).toBe(200);
    expect(tenantA.body.items[0].tenant_id).toBe("tenant-alpha");
    expect(tenantB.body.items[0].tenant_id).toBe("tenant-beta");
    expect(tenantA.body.items[0].id).not.toBe(tenantB.body.items[0].id);
  });
});
