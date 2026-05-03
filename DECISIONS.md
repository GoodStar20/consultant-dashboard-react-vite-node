# DECISIONS

## 1) Framework choices

- **Frontend: React + TypeScript**: this task needs URL-synced filtering, detail panel state, and optimistic row updates in one page. React hooks (`useSearchParams`, `useMemo`, local state) make those interactions explicit without a heavy state framework.
- **Backend: Node Fastify + TypeScript**: route-level schema and generated Swagger are easy to keep aligned while iterating on 500+ row querying and PATCH annotation behavior with tenant header checks.

## 2) 500-row table strategy

- I used **custom pagination** (25 rows/page) in a hand-built `<table role="grid">`, with keyboard row navigation and selectable rows.
- At 50,000 rows this breaks down on:
  - server payload size if returning all rows at once,
  - slow filter/sort UX if done in-browser.
- First change would be server-side pagination/cursor endpoints and client-side virtualized rendering window.

## 3) Optimistic annotation rollback + concurrent edits

Code used for optimistic update and rollback:

```ts
const handleAnnotationSave = async (annotation: string) => {
  if (!selected) return;
  setSaving(true);
  setSaveError(null);
  const previous = selected.annotation;
  setRows((current) =>
    current.map((row) =>
      row.id === selected.id ? { ...row, annotation } : row
    )
  );
  try {
    await patchAnnotation(tenantId, selected.id, annotation);
  } catch {
    setRows((current) =>
      current.map((row) =>
        row.id === selected.id ? { ...row, annotation: previous } : row
      )
    );
    setSaveError("Save failed; annotation was reverted.");
  } finally {
    setSaving(false);
  }
};
```

If two users edit nearly simultaneously, current behavior is **last write wins**. To improve this, add optimistic concurrency (version field / `If-Match` ETag) and return `409 Conflict` on stale updates.

## 4) Scaling to 1B records (first 3 changes)

1. **DB layer**: move to partitioned SQL (or distributed DB) keyed by `tenant_id` and time; add covering indexes for `(tenant_id, severity, module, status, created_at)`.
2. **API layer**: switch `/gaps` to cursor pagination + explicit sort keys, and cache `/summary` per tenant/filter with invalidation strategy.
3. **UI layer**: use virtualized table + server-driven pagination/filtering and debounce search to avoid flooding API.
