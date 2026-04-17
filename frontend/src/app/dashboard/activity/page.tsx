"use client";

import { useEffect, useState } from "react";
import {
  Activity as ActivityIcon,
  MessageSquare,
  UserPlus,
  UserMinus,
  Edit3,
  Image as ImageIcon,
  Bot,
  User,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, type Activity } from "@/lib/api";

const ACTION_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  "chat.message": { icon: MessageSquare, color: "text-blue-600 bg-blue-50", label: "Chat message" },
  "tenant.added": { icon: UserPlus, color: "text-emerald-600 bg-emerald-50", label: "Tenant added" },
  "tenant.updated": { icon: Edit3, color: "text-amber-600 bg-amber-50", label: "Tenant updated" },
  "tenant.removed": { icon: UserMinus, color: "text-rose-600 bg-rose-50", label: "Tenant removed" },
  "poster.regenerated": { icon: ImageIcon, color: "text-purple-600 bg-purple-50", label: "Poster regenerated" },
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function summarize(a: Activity): string {
  const d = a.details as Record<string, unknown>;
  switch (a.action) {
    case "chat.message":
      return (d.message as string) || "(empty)";
    case "tenant.added":
      return `${d.name} (floor ${d.floor || "—"}, unit ${d.unit || "—"})`;
    case "tenant.updated":
      return `${d.name}${d.floor ? ` → floor ${d.floor}` : ""}${d.status ? ` → ${d.status}` : ""}`;
    case "tenant.removed":
      return `${d.name}`;
    case "poster.regenerated":
      return `${d.building_name} v${d.version} · ${d.tenant_count} tenants · reason: ${d.reason}`;
    default:
      return JSON.stringify(d);
  }
}

export default function ActivityPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.activity(200);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Activity Log</h1>
          <p className="text-neutral-500 mt-1">
            Every action by the operating layer and team — auto-refreshes every 5s.
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-neutral-500">Loading...</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <ActivityIcon className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-neutral-500 text-sm">No activity yet</p>
            <p className="text-neutral-400 text-xs mt-1">Ask the assistant to do something!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              {items.map((a) => {
                const meta = ACTION_META[a.action] ?? {
                  icon: ActivityIcon,
                  color: "text-neutral-600 bg-neutral-100",
                  label: a.action,
                };
                const Icon = meta.icon;
                const ActorIcon = a.actor_type === "user" ? User : Bot;
                return (
                  <div key={a.id} className="flex items-start gap-4 p-4 hover:bg-neutral-50 transition-colors">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-neutral-900">{meta.label}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                          <ActorIcon className="w-2.5 h-2.5" />
                          {a.actor_type === "user" ? "User" : "Operating Layer"}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-600 truncate">{summarize(a)}</div>
                    </div>
                    <div className="text-xs text-neutral-400 flex-shrink-0 mt-1">
                      {timeAgo(a.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
