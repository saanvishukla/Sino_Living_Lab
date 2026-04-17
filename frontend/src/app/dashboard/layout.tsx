import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileImage,
  MessageSquare,
  Activity,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/tenants", icon: Users, label: "Tenants" },
  { href: "/dashboard/buildings", icon: Building2, label: "Buildings" },
  { href: "/dashboard/posters", icon: FileImage, label: "E-Directory" },
  { href: "/dashboard/chat", icon: MessageSquare, label: "AI Assistant" },
  { href: "/dashboard/activity", icon: Activity, label: "Activity Log" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="text-sm font-medium text-neutral-700">SG</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-neutral-900 truncate">Admin</div>
              <div className="text-xs text-neutral-500 truncate">admin@sino.com</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
