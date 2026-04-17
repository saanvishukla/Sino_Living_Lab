"use client";

import { useCallback, useEffect, useState } from "react";
import { FileImage, Sparkles, RefreshCw, Check, X, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, type Building, type Poster } from "@/lib/api";

export default function PostersPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [bs, ps] = await Promise.all([api.buildings(), api.posters()]);
    setBuildings(bs);
    setPosters(ps);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const generate = async (buildingId: string) => {
    setGenerating(buildingId);
    try {
      await api.generatePoster(buildingId);
      await load();
    } catch (e) {
      alert(`Failed: ${e}`);
    } finally {
      setGenerating(null);
    }
  };

  const liveFor = (buildingId: string) =>
    posters.filter((p) => p.building_id === buildingId && p.is_live)[0];

  const pendingPosters = posters.filter((p) => p.status === "pending_approval");

  const approve = async (id: string) => {
    await api.approvePoster(id);
    await load();
  };
  const reject = async (id: string) => {
    await api.rejectPoster(id);
    await load();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">E-Directory</h1>
          <p className="text-neutral-500 mt-1">
            Live directory posters for each Sino building. Auto-regenerate on data changes.
          </p>
        </div>
        <Button variant="outline" onClick={() => load()}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {pendingPosters.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
              Pending Approval ({pendingPosters.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPosters.map((p) => {
              const b = buildings.find((bb) => bb.id === p.building_id);
              return (
                <Card key={p.id} className="border-amber-200">
                  <CardContent className="p-0 overflow-hidden">
                    <div className="aspect-[9/16] bg-neutral-100 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={api.posterImageUrl(p.id)}
                        alt="Pending poster"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide bg-amber-500 text-white px-2 py-0.5 rounded">
                        Draft · v{p.version}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-sm font-semibold text-neutral-900 mb-0.5">{b?.name ?? "—"}</div>
                      <div className="text-xs text-neutral-500 mb-3">
                        {new Date(p.created_at).toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => approve(p.id)} className="flex-1">
                          <Check className="w-4 h-4" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => reject(p.id)}
                          className="flex-1"
                        >
                          <X className="w-4 h-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-neutral-500">Loading...</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((b) => {
            const latest = liveFor(b.id);
            const isGen = generating === b.id;
            return (
              <Card key={b.id}>
                <CardContent className="p-0 overflow-hidden">
                  <div className="aspect-[9/16] bg-neutral-100 flex items-center justify-center relative">
                    {latest ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={api.posterImageUrl(latest.id)}
                        alt={`${b.name} directory`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <FileImage className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                        <p className="text-sm text-neutral-500">No poster generated yet</p>
                      </div>
                    )}
                    {isGen && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-neutral-700">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          Generating...
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{b.name}</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {latest
                            ? `v${latest.version} · ${new Date(latest.created_at).toLocaleString()}`
                            : "Never generated"}
                        </p>
                      </div>
                      {latest?.is_live && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wide">
                          Live
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => generate(b.id)}
                      disabled={isGen}
                      className="w-full"
                    >
                      <Sparkles className="w-4 h-4" />
                      {latest ? "Regenerate" : "Generate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
