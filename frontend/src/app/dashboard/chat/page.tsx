"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ToolCall {
  name: string;
  arguments: string;
  result: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  tool_calls?: ToolCall[];
}

const SUGGESTIONS = [
  {
    title: "Add a new tenant",
    subtitle: "Register Starbucks on floor 5 of Sino Plaza",
  },
  {
    title: "Regenerate e-directory",
    subtitle: "For Sino Plaza with the latest tenant data",
  },
  {
    title: "Who moved in this month?",
    subtitle: "List recent tenant additions across buildings",
  },
  {
    title: "Check compliance",
    subtitle: "Validate the latest poster against brand guidelines",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const token = typeof window !== "undefined" ? localStorage.getItem("sino_token") : null;
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: content, history }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply, tool_calls: data.tool_calls },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I can't reach the operating layer right now. Make sure the backend is running on port 8000.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="h-14 border-b border-neutral-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-900">Sino Assistant</span>
        </div>
        <button className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
          New conversation
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center px-6">
            <div className="max-w-2xl w-full text-center">
              <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-3">
                How can I help you today?
              </h1>
              <p className="text-neutral-500 mb-10">
                Ask me to manage tenants, regenerate e-directories, or check compliance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-left">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.subtitle)}
                    className="group p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-all text-left"
                  >
                    <div className="text-sm font-medium text-neutral-900 mb-0.5">
                      {s.title}
                    </div>
                    <div className="text-xs text-neutral-500 line-clamp-2">
                      {s.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} tool_calls={m.tool_calls} />
            ))}
            {loading && <TypingIndicator />}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-6 pb-6 pt-2 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-neutral-300 focus-within:border-neutral-900 bg-white shadow-sm transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Message the operating layer…"
              className="w-full resize-none px-5 py-4 pr-16 bg-transparent outline-none text-[15px] text-neutral-900 placeholder:text-neutral-400 max-h-48"
              style={{ minHeight: "60px" }}
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className={`absolute right-3 bottom-3 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                loading || !input.trim()
                  ? "bg-neutral-300 text-white cursor-not-allowed"
                  : "bg-[var(--sino-primary)] text-white hover:bg-rose-800 cursor-pointer shadow-sm"
              }`}
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-center text-[11px] text-neutral-400 mt-3">
            The assistant can update tenants, regenerate posters, and trigger workflows. Review before approving.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  tool_calls,
}: {
  role: "user" | "assistant";
  content: string;
  tool_calls?: ToolCall[];
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-neutral-900 text-white px-4 py-2.5 text-[15px] leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 pt-0.5 min-w-0">
        <div className="text-xs font-medium text-neutral-500 mb-1.5">Sino Assistant</div>
        {tool_calls && tool_calls.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tool_calls.map((tc, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded"
                title={tc.arguments}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {tc.name}
              </span>
            ))}
          </div>
        )}
        <div className="text-[15px] leading-relaxed text-neutral-900 space-y-3 [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-neutral-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:marker:text-neutral-400 [&_code]:bg-neutral-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono [&_code]:text-neutral-700 [&_a]:text-[var(--sino-primary)] [&_a]:underline [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex items-center gap-1 pt-2">
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.15s]" />
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.3s]" />
      </div>
    </div>
  );
}
