"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { api, setToken } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } =
        mode === "login"
          ? await api.login(email, password)
          : await api.signup(email, name, password);
      setToken(token);
      router.push("/dashboard/chat");
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-lg bg-[var(--sino-primary)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">Sino Operating Layer</span>
        </Link>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            {mode === "login"
              ? "Sign in to manage tenants and posters."
              : "First account becomes admin."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Name">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                  placeholder="Your name"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                placeholder="you@sino.com"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                placeholder="At least 6 characters"
              />
            </Field>

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-100 text-center text-sm text-neutral-500">
            {mode === "login" ? (
              <>
                New here?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-[var(--sino-primary)] font-medium hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-[var(--sino-primary)] font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-700 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
