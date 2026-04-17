"use client";

import { useRef, useState } from "react";
import { Plug, Upload, Webhook, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, API_BASE } from "@/lib/api";

type SyncResult = {
  source: string;
  received: number;
  created: number;
  updated: number;
  errors: { tenant: string; error: string }[];
  regenerated_posters: unknown[];
};

export default function PluginPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.uploadCsv(file);
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Tenant Plug-in</h1>
        <p className="text-neutral-500 mt-1">
          Automated data intake. Tenant changes trigger instant poster regeneration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Upload className="w-5 h-5 text-emerald-600" />
              </div>
              <CardTitle>CSV Bulk Import</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 mb-4">
              Upload a CSV with columns: <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">name, building, unit, floor, category, contact_email, contact_phone, status</code>.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Select CSV"}
              </Button>
              <a
                href="/sample_tenants.csv"
                download
                className="text-xs text-neutral-500 hover:text-neutral-900 underline"
              >
                Download sample CSV
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Webhook className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle>Live Webhook</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 mb-3">
              Point your external system at this endpoint to sync tenant data in real-time:
            </p>
            <code className="block text-xs bg-neutral-900 text-emerald-400 p-3 rounded-md font-mono overflow-x-auto">
              POST {API_BASE}/api/plugin/sync
            </code>
            <details className="mt-3 text-xs text-neutral-600">
              <summary className="cursor-pointer hover:text-neutral-900">Example payload</summary>
              <pre className="mt-2 bg-neutral-50 p-3 rounded border border-neutral-200 overflow-x-auto">
{`{
  "source": "erp_system",
  "tenants": [
    {
      "name": "Nike",
      "building": "PLAZA",
      "floor": "3",
      "unit": "3-12",
      "category": "Retail",
      "status": "active"
    }
  ]
}`}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-rose-900">Upload failed</div>
              <div className="text-sm text-rose-700 mt-1">{error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-neutral-900">Sync complete</div>
                <div className="text-sm text-neutral-500 mt-0.5">
                  Source: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-xs">{result.source}</code>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Stat label="Received" value={result.received} />
              <Stat label="Created" value={result.created} color="text-emerald-600" />
              <Stat label="Updated" value={result.updated} color="text-amber-600" />
              <Stat label="Errors" value={result.errors.length} color={result.errors.length ? "text-rose-600" : "text-neutral-900"} />
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600 border-t border-neutral-100 pt-4">
              <FileText className="w-4 h-4" />
              Regenerated <strong>{result.regenerated_posters.length}</strong> poster{result.regenerated_posters.length !== 1 ? "s" : ""} automatically.
            </div>
            {result.errors.length > 0 && (
              <div className="mt-4 text-xs bg-rose-50 border border-rose-100 rounded p-3">
                <div className="font-medium text-rose-900 mb-1">Errors:</div>
                <ul className="space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-rose-700">
                      <code>{e.tenant}</code>: {e.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!result && !error && (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Plug className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500">
              Upload a CSV or call the webhook to sync tenant data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, color = "text-neutral-900" }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
    </div>
  );
}
