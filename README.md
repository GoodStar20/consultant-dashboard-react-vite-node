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

### Screenshot1
<img width="1144" height="1194" alt="image" src="https://github.com/user-attachments/assets/2c738cb7-18cb-4915-ace3-7a53d85c7fe6" />

### Screenshot2
<img width="1142" height="1168" alt="image" src="https://github.com/user-attachments/assets/95e8b5d6-73c8-4e59-9865-528cac034657" />

### Screenshot3
<img width="2442" height="1179" alt="image" src="https://github.com/user-attachments/assets/0430ed1f-050b-452a-9382-70d41c5b51c3" />

<img width="2230" height="1182" alt="image" src="https://github.com/user-attachments/assets/de3560ef-56e6-44b5-8e4e-69d1a866cbe3" />

### Screenshot4
<img width="1163" height="1013" alt="image" src="https://github.com/user-attachments/assets/8c025fe7-d4a3-48c6-a7c6-2631648e4a83" />

### Screenshot5
<img width="1108" height="478" alt="image" src="https://github.com/user-attachments/assets/26f0bcaa-e127-4ff9-abd1-fd9b95858996" />

<img width="1120" height="449" alt="image" src="https://github.com/user-attachments/assets/ff59ec36-9fc2-4142-9513-ed12d84d8ec9" />

### Screenshot6
<img width="1391" height="761" alt="image" src="https://github.com/user-attachments/assets/85b109d7-b529-4be2-837d-fa486df1871d" />



