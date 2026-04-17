import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-white flex flex-col">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-60 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-rose-100/40 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-50 to-transparent blur-3xl" />
      </div>

      <nav className="border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[var(--sino-primary)] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">S</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-neutral-900 tracking-tight">Sino Group</span>
              <span className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                Operating Layer
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/chat"
            className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors flex items-center gap-1.5 font-medium"
          >
            Sign in <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <section className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-8 py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
          <div className="lg:col-span-7">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-neutral-900 mb-6 leading-[1.02]">
              The operating
              <br />
              layer behind
              <br />
              <span className="text-[var(--sino-primary)]">your brand.</span>
            </h1>
            <p className="text-lg text-neutral-600 max-w-xl mb-10 leading-relaxed">
              Tenant data flows in automatically. E-directories stay in sync.
              Everything — from updates to approvals — happens by talking to one
              intelligent assistant.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/chat"
                className="inline-flex items-center gap-2 px-6 h-11 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Open Assistant
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 h-11 rounded-md border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                View dashboard
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-rose-100/50 to-transparent rounded-3xl blur-xl" />
              <div className="relative rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  </div>
                  <span className="text-xs font-medium text-neutral-600 ml-2">Sino Assistant</span>
                </div>
                <div className="p-6 space-y-5 text-[13.5px]">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[11px] font-bold">SG</span>
                    </div>
                    <div className="rounded-2xl bg-neutral-100 px-3.5 py-2.5 text-neutral-800">
                      Move Starbucks to floor 5 and regenerate the directory.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--sino-primary)] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[11px] font-bold">AI</span>
                    </div>
                    <div className="rounded-2xl bg-rose-50 border border-rose-100 px-3.5 py-2.5 text-neutral-800">
                      Updated Starbucks → Floor 5. Regenerating e-directory for Sino Plaza…
                      <span className="inline-block w-1.5 h-3 bg-[var(--sino-primary)] ml-0.5 align-middle animate-pulse" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">database</span>
                    <span className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">poster engine</span>
                    <span className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">compliance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between text-xs text-neutral-500">
          <span>© Sino Group Operating Layer</span>
          <span>Autonomous · Real-time · Conversational</span>
        </div>
      </footer>
    </div>
  );
}
