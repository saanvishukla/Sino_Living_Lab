"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  FileImage,
  MessageSquare,
  Activity,
  Plug,
  LogOut,
} from "lucide-react";
import { api, getToken, setToken, type AuthUser } from "@/lib/api";

const navItems = [
  { href: "/dashboard/chat", icon: MessageSquare, label: "AI Assistant" },
  { href: "/dashboard/tenants", icon: Users, label: "Tenants" },
  { href: "/dashboard/buildings", icon: Building2, label: "Buildings" },
  { href: "/dashboard/posters", icon: FileImage, label: "E-Directory" },
  { href: "/dashboard/plugin", icon: Plug, label: "Tenant Plug-in" },
  { href: "/dashboard/activity", icon: Activity, label: "Activity Log" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api
      .me()
      .then((u) => {
        setUser(u);
        setReady(true);
      })
      .catch(() => {
        setToken(null);
        router.replace("/login");
      });
  }, [router]);

  const logout = () => {
    setToken(null);
    router.replace("/login");
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">
        Loading...
      </div>
    );
  }

  const initials = (user?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--sino-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <div className="font-bold text-neutral-900 text-sm">Sino Group</div>
              <div className="text-xs text-neutral-500 -mt-0.5">Operating Layer</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-200 space-y-1">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center">
              <span className="text-sm font-medium text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-neutral-900 truncate">{user?.name}</div>
              <div className="text-xs text-neutral-500 truncate">
                {user?.email} · <span className="capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
