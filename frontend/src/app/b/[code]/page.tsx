import Link from "next/link";
import { notFound } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type PublicBuilding = {
  id: string;
  name: string;
  name_zh: string | null;
  code: string;
  address: string | null;
  address_zh: string | null;
  tenants: {
    id: string;
    name: string;
    name_zh: string | null;
    unit: string | null;
    floor: string | null;
    category: string | null;
    category_zh: string | null;
  }[];
};

async function fetchBuilding(code: string): Promise<PublicBuilding | null> {
  try {
    const r = await fetch(
      `${API_BASE}/api/public/buildings/${encodeURIComponent(code)}`,
      { cache: "no-store" }
    );
    if (!r.ok) return null;
    return (await r.json()) as PublicBuilding;
  } catch {
    return null;
  }
}

function floorKey(f: string): [number, string] {
  const s = f.trim().toUpperCase();
  if (s.startsWith("B")) {
    const n = parseInt(s.slice(1), 10);
    return [isNaN(n) ? -999 : -n, s];
  }
  if (s === "G") return [0, s];
  const n = parseInt(s, 10);
  return [isNaN(n) ? 99 : n, s];
}

export default async function BuildingPublicPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const b = await fetchBuilding(code);
  if (!b) return notFound();

  const byFloor = new Map<string, PublicBuilding["tenants"]>();
  for (const t of b.tenants) {
    const k = t.floor || "—";
    if (!byFloor.has(k)) byFloor.set(k, []);
    byFloor.get(k)!.push(t);
  }
  const floors = [...byFloor.keys()].sort((a, b) => {
    const [ax, as] = floorKey(a);
    const [bx, bs] = floorKey(b);
    if (ax !== bx) return bx - ax;
    return as.localeCompare(bs);
  });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="bg-[#c8102e] text-white px-6 pt-10 pb-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest opacity-80">
            <div className="h-8 w-8 rounded bg-white text-[#c8102e] font-bold grid place-items-center">
              S
            </div>
            Sino Group · E-Directory · 電子指南
          </div>
          <h1 className="mt-6 text-4xl font-semibold">{b.name}</h1>
          {b.name_zh && (
            <p className="mt-1 text-2xl opacity-95">{b.name_zh}</p>
          )}
          {b.address && (
            <p className="mt-3 text-sm opacity-90">
              {b.address_zh || b.address}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        {floors.length === 0 && (
          <p className="text-gray-500">No tenants yet.</p>
        )}

        {floors.map((f) => (
          <section key={f} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded bg-[#c8102e] text-white w-10 h-10 grid place-items-center font-semibold">
                {f}
              </div>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <ul className="divide-y divide-gray-100">
              {byFloor
                .get(f)!
                .sort((x, y) => x.name.localeCompare(y.name))
                .map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/t/${t.id}`}
                      className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded"
                    >
                      <div>
                        <div className="font-medium">{t.name}</div>
                        {t.name_zh && t.name_zh !== t.name && (
                          <div className="text-sm text-gray-600">
                            {t.name_zh}
                          </div>
                        )}
                        {t.category && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {t.category}
                            {t.category_zh ? ` · ${t.category_zh}` : ""}
                          </div>
                        )}
                      </div>
                      {t.unit && (
                        <div className="text-sm text-gray-500">{t.unit}</div>
                      )}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}

        <p className="mt-16 text-xs text-gray-400 text-center">
          Powered by the Sino Operating Layer · 信和營運平台
        </p>
      </main>
    </div>
  );
}
