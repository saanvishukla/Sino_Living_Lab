import Link from "next/link";
import { notFound } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type PublicTenant = {
  id: string;
  name: string;
  name_zh: string | null;
  unit: string | null;
  floor: string | null;
  category: string | null;
  category_zh: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  building: {
    id: string;
    name: string;
    name_zh: string | null;
    code: string;
    address: string | null;
    address_zh: string | null;
  } | null;
};

async function fetchTenant(id: string): Promise<PublicTenant | null> {
  try {
    const r = await fetch(`${API_BASE}/api/public/tenants/${id}`, {
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) as PublicTenant;
  } catch {
    return null;
  }
}

export default async function TenantPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await fetchTenant(id);
  if (!tenant) return notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#c8102e] to-[#7a0a1c] text-white">
      <div className="mx-auto max-w-xl px-6 pt-10 pb-16">
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest opacity-80">
          <div className="h-8 w-8 rounded bg-white text-[#c8102e] font-bold grid place-items-center">
            S
          </div>
          Sino Group · 信和集團
        </div>

        <h1 className="mt-10 text-4xl font-semibold">{tenant.name}</h1>
        {tenant.name_zh && tenant.name_zh !== tenant.name && (
          <p className="mt-1 text-2xl opacity-90">{tenant.name_zh}</p>
        )}

        {tenant.category && (
          <p className="mt-2 text-sm opacity-80">
            {tenant.category}
            {tenant.category_zh ? ` · ${tenant.category_zh}` : ""}
          </p>
        )}

        <div className="mt-8 rounded-2xl bg-white/10 backdrop-blur-sm p-5 space-y-3 text-sm">
          {tenant.building && (
            <Row
              label="Building · 大廈"
              value={
                <>
                  {tenant.building.name}
                  {tenant.building.name_zh ? ` · ${tenant.building.name_zh}` : ""}
                </>
              }
            />
          )}
          {tenant.floor && <Row label="Floor · 樓層" value={tenant.floor} />}
          {tenant.unit && <Row label="Unit · 單位" value={tenant.unit} />}
          {tenant.contact_email && (
            <Row
              label="Email · 電郵"
              value={
                <a
                  className="underline"
                  href={`mailto:${tenant.contact_email}`}
                >
                  {tenant.contact_email}
                </a>
              }
            />
          )}
          {tenant.contact_phone && (
            <Row
              label="Phone · 電話"
              value={
                <a className="underline" href={`tel:${tenant.contact_phone}`}>
                  {tenant.contact_phone}
                </a>
              }
            />
          )}
          {tenant.building?.address && (
            <Row
              label="Address · 地址"
              value={
                <>
                  {tenant.building.address}
                  {tenant.building.address_zh ? (
                    <>
                      <br />
                      {tenant.building.address_zh}
                    </>
                  ) : null}
                </>
              }
            />
          )}
        </div>

        {tenant.building && (
          <Link
            href={`/b/${tenant.building.code}`}
            className="mt-6 inline-block rounded-full bg-white text-[#c8102e] px-5 py-2 text-sm font-medium hover:bg-gray-100"
          >
            View full directory · 查看完整指南 →
          </Link>
        )}

        <p className="mt-16 text-xs opacity-60">
          Powered by the Sino Operating Layer · 信和營運平台
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest opacity-70">
        {label}
      </span>
      <span className="mt-0.5">{value}</span>
    </div>
  );
}
