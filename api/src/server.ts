import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { z } from "zod";
import { GapStore } from "./store.js";
import { modules, severities, statuses } from "./types.js";

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";

const tenantHeader = z.object({
  "x-tenant-id": z.string().min(1)
});

// JSON schema used for Swagger docs (Fastify/Swagger uses JSON schema, not Zod)
const tenantHeaderJsonSchema = {
  type: "object",
  required: ["x-tenant-id"],
  properties: {
    "x-tenant-id": { type: "string" }
  }
} as const;

const gapRecordSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    scope_item: { type: "string" },
    module: { type: "string", enum: [...modules] },
    gap_type: { type: "string" },
    severity: { type: "string", enum: [...severities] },
    score: { type: "number" },
    customer_name: { type: "string" },
    tenant_id: { type: "string" },
    created_at: { type: "string" },
    status: { type: "string", enum: [...statuses] },
    annotation: { type: "string" }
  }
} as const;

const querySchema = z.object({
  severity: z.enum(severities).optional(),
  module: z.enum(modules).optional(),
  status: z.enum(statuses).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["created_at", "score", "severity"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional()
});

const patchBodySchema = z.object({
  annotation: z.string().max(2000)
});

export const buildServer = () => {
  const app = Fastify({ logger: false });
  const store = new GapStore();

  app.addHook("onRequest", async (request) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        remoteAddress: request.ip,
        tenant: request.headers["x-tenant-id"]
      },
      "incoming request"
    );
  });

  app.addHook("onResponse", async (request, reply) => {
    request.log.info(
      { method: request.method, url: request.url, statusCode: reply.statusCode },
      "response sent"
    );
  });

  app.setErrorHandler((error: unknown, request, reply) => {
    const err = error as { statusCode?: number; message?: string };

    request.log.error({ err: error }, "unhandled error");

    const statusCode = typeof err?.statusCode === "number" ? err.statusCode : 500;
    const message = typeof err?.message === "string" ? err.message : "Internal Server Error";

    reply.status(statusCode).send({ error: message });
  });


  app.register(cors, {
    origin: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "x-tenant-id"],
    exposedHeaders: ["x-tenant-id"]
  });
  app.register(swagger, {
    mode: "dynamic",
    openapi: {
      info: { title: "Gap API", version: "1.0.0" },
      servers: [{ url: `http://localhost:${PORT}` }]
    }
  });
  app.register(swaggerUi, { routePrefix: "/docs" });


  app.register(async (api) => {
    // Simple health endpoint to verify the server is reachable.
    api.get(
      "/health",
      {
        schema: {
          tags: ["meta"],
          summary: "Health check",
          response: {
            200: {
              type: "object",
              properties: { ok: { type: "boolean" } }
            }
          }
        }
      },
      async () => ({ ok: true })
    );

    api.get(
      "/gaps",
      {
        schema: {
          tags: ["gaps"],
          summary: "List gaps for tenant",
          headers: tenantHeaderJsonSchema,
          querystring: {
            type: "object",
            properties: {
              severity: { type: "string", enum: [...severities] },
              module: { type: "string", enum: [...modules] },
              status: { type: "string", enum: [...statuses] },
              search: { type: "string" },
              sortBy: { type: "string", enum: ["created_at", "score", "severity"] },
              sortDir: { type: "string", enum: ["asc", "desc"] }
            }
          },
          response: {
            200: {
              type: "object",
              properties: {
                items: { type: "array", items: gapRecordSchema }
              }
            },
            400: {
              type: "object",
              properties: { error: { type: "string" } }
            }
          }
        }
      },
      async (request, reply) => {
        const headers = tenantHeader.safeParse(request.headers);
        if (!headers.success) return reply.status(400).send({ error: "x-tenant-id header required" });
        const query = querySchema.parse(request.query);
        return { items: store.list(headers.data["x-tenant-id"], query) };
      }
    );

    api.get(
      "/gaps/:id",
      {
        schema: {
          tags: ["gaps"],
          summary: "Get a gap by id",
          headers: tenantHeaderJsonSchema,
          params: {
            type: "object",
            required: ["id"],
            properties: { id: { type: "string" } }
          },
          response: {
            200: gapRecordSchema,
            400: { type: "object", properties: { error: { type: "string" } } },
            404: { type: "object", properties: { error: { type: "string" } } }
          }
        }
      },
      async (request, reply) => {
        const headers = tenantHeader.safeParse(request.headers);
        if (!headers.success) return reply.status(400).send({ error: "x-tenant-id header required" });
        const { id } = request.params as { id: string };
        const gap = store.getById(id, headers.data["x-tenant-id"]);
        if (!gap) return reply.status(404).send({ error: "gap not found" });
        return gap;
      }
    );

    api.patch(
      "/gaps/:id",
      {
        schema: {
          tags: ["gaps"],
          summary: "Update annotation",
          headers: tenantHeaderJsonSchema,
          params: {
            type: "object",
            required: ["id"],
            properties: { id: { type: "string" } }
          },
          body: {
            type: "object",
            required: ["annotation"],
            properties: { annotation: { type: "string", maxLength: 2000 } }
          },
          response: {
            200: gapRecordSchema,
            400: { type: "object", properties: { error: { type: "string" } } },
            404: { type: "object", properties: { error: { type: "string" } } },
            500: { type: "object", properties: { error: { type: "string" } } }
          }
        }
      },
      async (request, reply) => {
        const headers = tenantHeader.safeParse(request.headers);
        if (!headers.success) return reply.status(400).send({ error: "x-tenant-id header required" });
        const body = patchBodySchema.parse(request.body);
        const { id } = request.params as { id: string };
        if (body.annotation.toLowerCase().includes("force-fail")) {
          return reply.status(500).send({ error: "simulated failure for rollback demo" });
        }
        const updated = store.updateAnnotation(id, headers.data["x-tenant-id"], body.annotation);
        if (!updated) return reply.status(404).send({ error: "gap not found" });
        return updated;
      }
    );

    api.get(
      "/summary",
      {
        schema: {
          tags: ["summary"],
          summary: "Tenant summary counts",
          headers: tenantHeaderJsonSchema,
          response: {
            200: {
              type: "object",
              properties: {
                severity: {
                  type: "object",
                  properties: {
                    H: { type: "number" },
                    M: { type: "number" },
                    L: { type: "number" }
                  }
                },
                module: {
                  type: "object",
                  properties: {
                    FI: { type: "number" },
                    MM: { type: "number" },
                    SD: { type: "number" },
                    PP: { type: "number" },
                    WM: { type: "number" }
                  }
                },
                scope: {
                  type: "object",
                  additionalProperties: { type: "number" }
                }
              }
            },
            400: { type: "object", properties: { error: { type: "string" } } }
          }
        }
      },
      async (request, reply) => {
        const headers = tenantHeader.safeParse(request.headers);
        if (!headers.success) return reply.status(400).send({ error: "x-tenant-id header required" });
        return store.summary(headers.data["x-tenant-id"]);
      }
    );
  });

  return app;
};
