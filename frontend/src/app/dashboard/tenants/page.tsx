"use client";

import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { api, type Building, type Tenant } from "@/lib/api";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingFilter, setBuildingFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const filtered = tenants.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Tenants</h1>
          <p className="text-neutral-500 mt-1">
            {loading ? "Loading..." : `${filtered.length} tenants across ${buildings.length} buildings`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenants..."
              className="pl-9 pr-4 h-10 rounded-md border border-neutral-300 text-sm focus:outline-none focus:border-neutral-500 bg-white w-64"
            />
          </div>
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-neutral-300 text-sm bg-white focus:outline-none focus:border-neutral-500"
          >
            <option value="">All buildings</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-rose-600">
            Failed to load tenants: {error}
          </CardContent>
        </Card>
      ) : filtered.length === 0 && !loading ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-neutral-500 text-sm">No tenants match your filters</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-5 py-3 font-medium">Tenant</th>
                  <th className="px-5 py-3 font-medium">Building</th>
                  <th className="px-5 py-3 font-medium">Floor</th>
                  <th className="px-5 py-3 font-medium">Unit</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-neutral-900">{t.name}</td>
                    <td className="px-5 py-3 text-neutral-600">{buildingName(t.building_id)}</td>
                    <td className="px-5 py-3 text-neutral-600">{t.floor || "—"}</td>
                    <td className="px-5 py-3 text-neutral-600">{t.unit || "—"}</td>
                    <td className="px-5 py-3">
                      {t.category && (
                        <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                          {t.category}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          t.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : t.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
