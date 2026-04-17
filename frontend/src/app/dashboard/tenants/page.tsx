"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Users, Search, X, ChevronDown, MoreHorizontal } from "lucide-react";
import { api, type Building, type Tenant } from "@/lib/api";

const CATEGORY_STYLES: Record<string, { pill: string; dot: string }> = {
  "F&B": { pill: "bg-orange-50 text-orange-700", dot: "bg-orange-500" },
  Retail: { pill: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  Finance: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  Fitness: { pill: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  Supermarket: { pill: "bg-lime-50 text-lime-700", dot: "bg-lime-500" },
};

function categoryPill(c?: string | null) {
  if (!c) return "bg-neutral-100 text-neutral-700";
  return CATEGORY_STYLES[c]?.pill || "bg-neutral-100 text-neutral-700";
}
function categoryDot(c?: string | null) {
  if (!c) return "bg-neutral-400";
  return CATEGORY_STYLES[c]?.dot || "bg-neutral-400";
}

function statusClass(s: string) {
  if (s === "active") return "bg-emerald-100 text-emerald-800";
  if (s === "pending") return "bg-amber-100 text-amber-800";
  return "bg-neutral-200 text-neutral-600";
}
function statusDot(s: string) {
  if (s === "active") return "bg-emerald-500";
  if (s === "pending") return "bg-amber-500";
  return "bg-neutral-400";
}

type TenantStatus = "active" | "pending" | "left";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingFilter, setBuildingFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.buildings(), api.tenants(buildingFilter || undefined)])
      .then(([bs, ts]) => {
        if (cancelled) return;
        setBuildings(bs);
        setTenants(ts);
        setError(null);
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [buildingFilter]);

  // Close bulk menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenants.filter(
      (t) =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t.unit || "").toLowerCase().includes(q) ||
        (t.floor || "").toLowerCase().includes(q)
    );
  }, [tenants, search]);

  const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;
  const filtersActive = Boolean(search || buildingFilter);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allVisibleSelected =
    filtered.length > 0 && filtered.every((t) => selected.has(t.id));
  const someVisibleSelected =
    filtered.some((t) => selected.has(t.id)) && !allVisibleSelected;
  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((t) => next.delete(t.id));
      else filtered.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const bulkUpdateStatus = async (status: TenantStatus) => {
    if (selected.size === 0) return;
    setMenuOpen(false);
    setUpdating(true);
    try {
      const ids = Array.from(selected);
      await Promise.all(ids.map((id) => api.updateTenant(id, { status })));
      // Optimistic local update
      setTenants((prev) =>
        prev.map((t) => (selected.has(t.id) ? { ...t, status } : t))
      );
      setSelected(new Set());
    } catch (e) {
      setError(String(e));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
            Directory
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">
            Tenants
          </h1>
          <p className="text-neutral-500 mt-1 text-sm">
            {loading
              ? "Loading…"
              : `${filtered.length} of ${tenants.length} tenants across ${buildings.length} Sino buildings`}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenant, unit, category…"
              className="pl-9 pr-4 h-10 rounded-lg border border-neutral-200 text-sm bg-white w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
            />
          </div>
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-neutral-200 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
          >
            <option value="">All buildings</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setBuildingFilter("");
              }}
              className="flex items-center gap-1 h-10 px-3 rounded-lg text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}

          {/* Bulk Update status */}
          <div ref={menuRef} className="relative">
            <button
              disabled={selected.size === 0 || updating}
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex items-center gap-2 h-10 pl-3 pr-2 rounded-lg border text-sm shadow-sm transition ${
                selected.size === 0
                  ? "border-neutral-200 bg-white text-neutral-400 cursor-not-allowed"
                  : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              {updating ? "Updating…" : "Update status"}
              {selected.size > 0 && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                  {selected.size}
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </button>
            {menuOpen && selected.size > 0 && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 overflow-hidden">
                {(["active", "pending", "left"] as TenantStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => bulkUpdateStatus(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2 capitalize"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusDot(s)}`}
                    />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="h-10 w-10 grid place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 shadow-sm"
            aria-label="More options"
            title="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 p-4 text-sm mb-4">
          Failed to load tenants: {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-left text-neutral-600">
                <th className="pl-6 pr-2 py-3 w-10">
                  <IndeterminateCheckbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-6 py-3 font-medium">Tenant</th>
                <th className="px-6 py-3 font-medium">Building</th>
                <th className="px-6 py-3 font-medium w-20">Floor</th>
                <th className="px-6 py-3 font-medium w-24">Unit</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium w-32 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="pl-6 pr-2 py-3.5">
                      <div className="h-4 w-4 bg-neutral-200 rounded" />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="h-3 w-32 bg-neutral-200 rounded" />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="h-3 w-24 bg-neutral-100 rounded" />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="h-3 w-8 bg-neutral-100 rounded" />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="h-3 w-12 bg-neutral-100 rounded" />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="h-5 w-16 bg-neutral-100 rounded-full" />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="h-5 w-16 bg-neutral-100 rounded-full mx-auto" />
                    </td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="px-6 py-16">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                        <Users className="w-5 h-5 text-neutral-400" />
                      </div>
                      <p className="text-sm font-medium text-neutral-900">
                        No tenants match your filters
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Try a different search or clear the filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((t) => {
                  const isSel = selected.has(t.id);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => toggleOne(t.id)}
                      className={`cursor-pointer transition-colors ${
                        isSel ? "bg-rose-50/70" : "hover:bg-neutral-50/70"
                      }`}
                    >
                      <td
                        className="pl-6 pr-2 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSel}
                          onChange={() => toggleOne(t.id)}
                          aria-label={`Select ${t.name}`}
                        />
                      </td>
                      <td
                        className={`px-6 py-3.5 font-medium ${
                          isSel ? "text-[#c8102e]" : "text-neutral-900"
                        }`}
                      >
                        {t.name}
                      </td>
                      <td className="px-6 py-3.5 text-neutral-600">
                        {buildingName(t.building_id)}
                      </td>
                      <td className="px-6 py-3.5 text-neutral-700 tabular-nums">
                        {t.floor || <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-neutral-600 tabular-nums">
                        {t.unit || <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-neutral-700">
                        {t.category || <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center gap-2 min-w-[104px] text-sm font-medium px-3.5 py-1.5 rounded-full capitalize ${statusClass(
                            t.status
                          )}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${statusDot(t.status)}`} />
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  ...props
}: {
  checked: boolean;
  onChange: () => void;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 rounded border-neutral-300 text-[#c8102e] focus:ring-[#c8102e]/30 accent-[#c8102e] cursor-pointer"
      {...props}
    />
  );
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  ...props
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 rounded border-neutral-300 text-[#c8102e] focus:ring-[#c8102e]/30 accent-[#c8102e] cursor-pointer"
      {...props}
    />
  );
}
