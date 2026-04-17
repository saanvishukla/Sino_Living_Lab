"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { api, type Building, type Tenant } from "@/lib/api";

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.buildings(), api.tenants()])
      .then(([bs, ts]) => {
        setBuildings(bs);
        setTenants(ts);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const tenantCount = (buildingId: string) =>
    tenants.filter((t) => t.building_id === buildingId && t.status === "active").length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Buildings</h1>
        <p className="text-neutral-500 mt-1">
          {loading ? "Loading..." : `${buildings.length} buildings under management`}
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-rose-600">
            Failed to load buildings: {error}
          </CardContent>
        </Card>
      ) : buildings.length === 0 && !loading ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-neutral-500 text-sm">No buildings yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {buildings.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--sino-primary)]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[var(--sino-primary)]" />
                  </div>
                  <span className="text-xs font-mono text-neutral-400">{b.code}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">{b.name}</h3>
                {b.address && (
                  <div className="flex items-start gap-1.5 text-xs text-neutral-500 mb-4">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{b.address}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                  <span className="text-xs text-neutral-500">Active tenants</span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {tenantCount(b.id)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
