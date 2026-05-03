import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchGaps, fetchSummary, patchAnnotation } from "./api";
import type { GapRecord, Module, Severity, Status } from "./types";

const pageSize = 25;

const severityValues: Severity[] = ["H", "M", "L"];
const moduleValues: Module[] = ["FI", "MM", "SD", "PP", "WM"];
const statusValues: Status[] = ["open", "in_review", "resolved"];

const controlClass =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1";

const buttonClass =
  "inline-flex items-center justify-center rounded-md border border-slate-700 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1";

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tenantId, setTenantId] = useState(searchParams.get("tenant_id") ?? "tenant-alpha");
  const [rows, setRows] = useState<GapRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState({ H: 0, M: 0, L: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filters = {
    severity: searchParams.get("severity") ?? "",
    module: searchParams.get("module") ?? "",
    status: searchParams.get("status") ?? "",
    search: searchParams.get("search") ?? "",
    sortBy: searchParams.get("sortBy") ?? "created_at",
    sortDir: searchParams.get("sortDir") ?? "desc",
    page: Number(searchParams.get("page") ?? "1")
  };

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId]
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("tenant_id", tenantId);
    if (!params.get("sortBy")) params.set("sortBy", "created_at");
    if (!params.get("sortDir")) params.set("sortDir", "desc");
    if (!params.get("page")) params.set("page", "1");
    setSearchParams(params, { replace: true });
  }, [tenantId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchGaps(tenantId, filters), fetchSummary(tenantId)])
      .then(([gaps, nextSummary]) => {
        if (!alive) return;
        setRows(gaps);
        setSummary(nextSummary.severity);
        if (gaps.length === 0) setSelectedId(null);
        else if (!gaps.find((row) => row.id === selectedId)) setSelectedId(gaps[0].id);
      })
      .catch(() => {
        if (alive) setError("Could not load data from API.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [tenantId, searchParams.toString()]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const activePage = Math.min(filters.page, totalPages);
  const pageRows = rows.slice((activePage - 1) * pageSize, activePage * pageSize);

  const setParam = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(name, value);
    else params.delete(name);
    params.set("page", "1");
    setSearchParams(params);
  };

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const handleAnnotationSave = async (annotation: string) => {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);

    const previous = selected.annotation;

    setRows((current) =>
      current.map((row) => (row.id === selected.id ? { ...row, annotation } : row))
    );

    try {
      await patchAnnotation(tenantId, selected.id, annotation);
    } catch {
      setRows((current) =>
        current.map((row) => (row.id === selected.id ? { ...row, annotation: previous } : row))
      );
      setSaveError("Save failed; annotation was reverted.");
    } finally {
      setSaving(false);
    }
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, id: string, idx: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedId(id);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = document.querySelector<HTMLTableRowElement>(`tr[data-row-index="${idx + 1}"]`);
      next?.focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = document.querySelector<HTMLTableRowElement>(`tr[data-row-index="${idx - 1}"]`);
      prev?.focus();
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            S4Accelerate Gap Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">Tenant-scoped gaps with filters and inline annotation.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700" htmlFor="tenant">
            Tenant
          </label>
          <select
            className={"min-w-[220px] " + controlClass}
            id="tenant"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          >
            <option value="tenant-alpha">tenant-alpha</option>
            <option value="tenant-beta">tenant-beta</option>
            <option value="tenant-gamma">tenant-gamma</option>
          </select>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {severityValues.map((s) => (
          <article key={s} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Severity</div>
            <div className="mt-1 flex items-end justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{s}</h2>
              <p className="text-3xl font-semibold tabular-nums text-slate-900">{summary[s]}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
        <select
          className={controlClass}
          aria-label="severity filter"
          value={filters.severity}
          onChange={(e) => setParam("severity", e.target.value)}
        >
          <option value="">All severity</option>
          {severityValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select
          className={controlClass}
          aria-label="module filter"
          value={filters.module}
          onChange={(e) => setParam("module", e.target.value)}
        >
          <option value="">All module</option>
          {moduleValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select
          className={controlClass}
          aria-label="status filter"
          value={filters.status}
          onChange={(e) => setParam("status", e.target.value)}
        >
          <option value="">All status</option>
          {statusValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <input
          className={controlClass}
          aria-label="customer search"
          value={filters.search}
          onChange={(e) => setParam("search", e.target.value)}
          placeholder="Search customer"
        />

        <select
          className={controlClass}
          aria-label="sort by"
          value={filters.sortBy}
          onChange={(e) => setParam("sortBy", e.target.value)}
        >
          <option value="created_at">Sort: Created</option>
          <option value="score">Sort: Score</option>
          <option value="severity">Sort: Severity</option>
        </select>

        <select
          className={controlClass}
          aria-label="sort direction"
          value={filters.sortDir}
          onChange={(e) => setParam("sortDir", e.target.value)}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </section>

      <div className="mt-4">
        {loading && <p className="text-sm text-slate-600" role="status">Loading dashboard...</p>}
        {error && (
          <p className="text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && rows.length === 0 && (
          <p className="text-sm text-slate-600" role="status">
            No results match this filter.
          </p>
        )}
      </div>

      {!loading && !error && rows.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <div className="overflow-auto">
              <table className="w-full border-collapse text-sm" aria-label="Gap table" role="grid">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="py-2 pr-3">Customer</th>
                    <th className="py-2 pr-3">Module</th>
                    <th className="py-2 pr-3">Severity</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      data-row-index={idx}
                      className={
                        "cursor-pointer border-b border-slate-100 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-[-2px] " +
                        (row.id === selectedId ? "bg-indigo-50" : "")
                      }
                      onClick={() => setSelectedId(row.id)}
                      onKeyDown={(event) => onRowKeyDown(event, row.id, idx)}
                    >
                      <td className="py-2 pr-3">{row.customer_name}</td>
                      <td className="py-2 pr-3">{row.module}</td>
                      <td className="py-2 pr-3">{row.severity}</td>
                      <td className="py-2 pr-3">{row.status}</td>
                      <td className="py-2 tabular-nums">{row.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-end gap-3">
              <button
                className={buttonClass}
                type="button"
                onClick={() => setPage(Math.max(1, activePage - 1))}
              >
                Prev
              </button>
              <span className="text-sm text-slate-700">
                {activePage} / {totalPages}
              </span>
              <button
                className={buttonClass}
                type="button"
                onClick={() => setPage(Math.min(totalPages, activePage + 1))}
              >
                Next
              </button>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            {selected ? (
              <>
                <h2 className="text-lg font-semibold text-slate-900">{selected.scope_item}</h2>

                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="font-medium text-slate-700">Gap type:</dt>
                  <dd className="text-slate-800">{selected.gap_type}</dd>

                  <dt className="font-medium text-slate-700">Created:</dt>
                  <dd className="text-slate-800">{new Date(selected.created_at).toLocaleString()}</dd>
                </dl>

                <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="annotation">
                  Annotation
                </label>
                <textarea
                  className={"mt-1 min-h-[140px] w-full " + controlClass}
                  id="annotation"
                  value={selected.annotation}
                  onChange={(e) =>
                    setRows((current) =>
                      current.map((row) =>
                        row.id === selected.id ? { ...row, annotation: e.target.value } : row
                      )
                    )
                  }
                />

                <div className="mt-3 flex items-center gap-3">
                  <button
                    className={buttonClass}
                    type="button"
                    disabled={saving}
                    onClick={() => handleAnnotationSave(selected.annotation)}
                  >
                    {saving ? "Saving..." : "Save annotation"}
                  </button>

                  {saveError && (
                    <p className="text-sm font-medium text-red-700" role="alert">
                      {saveError}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">Select a gap row for details.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;
