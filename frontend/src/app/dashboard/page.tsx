"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  FileImage,
  Info,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";

type Suggestion = Awaited<
  ReturnType<typeof api.suggestions>
>["suggestions"][number];
type Summary = Awaited<ReturnType<typeof api.summary>>;
type Notif = Awaited<ReturnType<typeof api.notifications>>["notifications"][number];

const SEVERITY_STYLES: Record<Suggestion["severity"], string> = {
  high: "bg-red-50 border-red-200 text-red-900",
  medium: "bg-amber-50 border-amber-200 text-amber-900",
  low: "bg-blue-50 border-blue-200 text-blue-900",
};
const SEVERITY_ICON: Record<Suggestion["severity"], React.ReactNode> = {
  high: <AlertTriangle className="w-4 h-4" />,
  medium: <Sparkles className="w-4 h-4" />,
  low: <Info className="w-4 h-4" />,
};

const CHART_COLORS = [
  "#c8102e",
  "#f4b223",
  "#2563eb",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export default function OverviewPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, sum, n] = await Promise.all([
        api.suggestions(),
        api.summary(),
        api.notifications(),
      ]);
      setSuggestions(s.suggestions);
      setSummary(sum);
      setNotifs(n.notifications);
    } catch {
      // ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Overview
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Live snapshot of the Sino Operating Layer · refreshes every 15s
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-sm"
          >
            <Bell className="w-4 h-4" />
            Notifications
            {notifs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#c8102e] text-white text-[10px] rounded-full w-5 h-5 grid place-items-center">
                {notifs.length}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-96 max-h-[70vh] overflow-auto bg-white border border-neutral-200 rounded-xl shadow-lg z-10">
              <div className="p-3 border-b text-xs uppercase tracking-widest text-neutral-500">
                Simulated WeChat + Email fan-out
              </div>
              {notifs.length === 0 && (
                <div className="p-4 text-sm text-neutral-500">
                  No notifications yet. Approve a poster to trigger a
                  simulated WeChat Work + email fan-out.
                </div>
              )}
              <ul className="divide-y">
                {notifs.map((n, i) => (
                  <li key={i} className="p-3 text-sm">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                          n.channel === "wechat_work"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {n.channel}
                      </span>
                      <span>{new Date(n.sent_at).toLocaleString()}</span>
                    </div>
                    <div className="font-medium text-neutral-900">
                      {n.subject}
                    </div>
                    <div className="text-neutral-500 text-xs mt-1">
                      To: {n.to}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi
          label="Buildings"
          value={summary?.totals.buildings ?? "—"}
          icon={<Building2 className="w-4 h-4" />}
        />
        <Kpi
          label="Active tenants"
          value={summary?.totals.active_tenants ?? "—"}
          sub={`of ${summary?.totals.tenants ?? "—"} total`}
          icon={<Users className="w-4 h-4" />}
        />
        <Kpi
          label="Live posters"
          value={summary?.totals.live_posters ?? "—"}
          sub={`${summary?.totals.posters ?? "—"} total versions`}
          icon={<FileImage className="w-4 h-4" />}
        />
        <Kpi
          label="Pending approval"
          value={summary?.totals.pending_posters ?? "—"}
          sub="posters waiting"
          icon={<CheckCircle2 className="w-4 h-4" />}
          accent={(summary?.totals.pending_posters ?? 0) > 0}
        />
      </div>

      {/* Suggestions panel */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#c8102e]" />
          <h2 className="text-lg font-medium">AI Suggestions</h2>
          <span className="text-xs text-neutral-500">
            ({suggestions.length})
          </span>
        </div>
        {loading && (
          <div className="text-sm text-neutral-400">Analyzing operations…</div>
        )}
        {!loading && suggestions.length === 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50 text-green-900 p-4 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Everything looks healthy — no actions needed right now.
          </div>
        )}
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 flex items-start gap-3 ${SEVERITY_STYLES[s.severity]}`}
            >
              <div className="mt-0.5">{SEVERITY_ICON[s.severity]}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{s.title}</div>
                <div className="text-sm opacity-80 mt-0.5">{s.body}</div>
              </div>
              {s.cta && (
                <Link
                  href={s.cta.href}
                  className="text-sm font-medium underline whitespace-nowrap"
                >
                  {s.cta.label} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Tenants by category · 按類別">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={summary?.by_category ?? []}
                dataKey="count"
                nameKey="category"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {(summary?.by_category ?? []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tenants by building · 按大廈">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary?.by_building ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="building" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#c8102e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Activity over last 14 days · 過去 14 天活動"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={summary?.activity_by_day ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#c8102e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 bg-white ${
        accent ? "border-[#c8102e]" : "border-neutral-200"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        {icon}
        {label}
      </div>
      <div
        className={`text-2xl font-semibold mt-1 ${
          accent ? "text-[#c8102e]" : "text-neutral-900"
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-neutral-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white p-4 ${
        className || ""
      }`}
    >
      <div className="text-sm font-medium text-neutral-700 mb-2">{title}</div>
      {children}
    </div>
  );
}
