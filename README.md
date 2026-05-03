# Fit-gap Consultant Dashboard

This repo contains:

- `api`: Node + TypeScript Fastify service with tenant-aware gap endpoints and Swagger.
- `web`: React + TypeScript dashboard with URL-synced filters and optimistic annotation editing.

## Start

Terminal 1:

```bash
cd api
npm install
npm run dev
```

Terminal 2:

```bash
cd web
npm install
npm run dev
```

Web runs at `http://localhost:5173`.

API runs at `http://localhost:4000`.

Swagger runs at `http://localhost:4000/docs`.

## API

- `GET /gaps`
- `GET /gaps/:id`
- `PATCH /gaps/:id` body `{ "annotation": "..." }`
- `GET /summary`

All requests must include header `x-tenant-id`.

## Tests

- Backend integration test:
  - `cd api && npm test`
- Frontend component + axe test:
  - `cd web && npm test`

## Proof checklist capture

1. Dashboard with summary cards and paginated rows.
2. Filter applied and URL query string includes the filter.
3. Details panel annotation edited and saved (show PATCH request in network tab).
4. Tenant switch (`tenant-alpha` vs `tenant-beta`) showing different rows.
5. Both test commands green.
6. Swagger page (`/docs`) visible.
