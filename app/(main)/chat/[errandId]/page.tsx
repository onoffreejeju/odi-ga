"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type ChatMessage = {
  id: string;
  errand_id: string;
  sender_id: string;
  content: string;
  type: "text" | "image" | "system";
  created_at: string;
};

type ErrandSummary = {
  id: string;
  description: string;
  pickup_name: string;
  dropoff_name: string;
  requester_id: string;
  matched_helper_id: string | null;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function ChatRoomPage({ params }: { params: { errandId: string } }) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [errand, setErrand] = useState<ErrandSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userId, setUserId] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  const loadMessages = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .select("id, errand_id, sender_id, content, type, created_at")
      .eq("errand_id", params.errandId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      setNotice(error.message);
      return;
    }

    setMessages((data || []) as ChatMessage[]);
  }, [params.errandId]);

  useEffect(() => {
    const loadRoom = async () => {
      if (!hasSupabaseEnv()) {
        setNotice("Supabase 환경변수가 없어 채팅을 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        router.push("/login");
        return;
      }

      setUserId(auth.user.id);

      const { data, error } = await supabase
        .from("errands")
        .select("id, description, pickup_name, dropoff_name, requester_id, matched_helper_id")
        .eq("id", params.errandId)
        .single();

      if (error) {
        setNotice(error.message);
        setLoading(false);
        return;
      }

      const room = data as ErrandSummary;
      const participant =
        room.requester_id === auth.user.id || room.matched_helper_id === auth.user.id;

      if (!participant) {
        setNotice("참여 중인 의뢰의 채팅만 볼 수 있습니다.");
        setLoading(false);
        return;
      }

      if (!room.matched_helper_id) {
        setNotice("헬퍼가 매칭된 뒤 채팅을 시작할 수 있습니다.");
      }

      setErrand(room);
      await loadMessages();
      setLoading(false);
    };

    loadRoom().catch((error) => {
      setNotice(error.message);
      setLoading(false);
    });
  }, [loadMessages, params.errandId, router]);

  useEffect(() => {
    if (!errand) return;

    const timer = window.setInterval(() => {
      loadMessages();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [errand, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = content.trim();
    if (!text || sending || !userId || !errand?.matched_helper_id) return;

    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from("messages").insert({
      errand_id: params.errandId,
      sender_id: userId,
      content: text,
      type: "text"
    });

    if (error) {
      setNotice(error.message);
      setSending(false);
      return;
    }

    setContent("");
    await loadMessages();
    setSending(false);
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700"
            aria-label="뒤로"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black text-slate-950 dark:text-white">
              {errand?.description || "채팅"}
            </h1>
            {errand ? (
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                {errand.pickup_name} → {errand.dropoff_name}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <section className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {notice ? (
          <p className="rounded-lg bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-700">
            {notice}
          </p>
        ) : null}

        {!loading && !messages.length ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
            아직 메시지가 없습니다.
          </div>
        ) : null}

        {messages.map((message) => {
          const mine = message.sender_id === userId;

          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-lg px-3 py-2 ${
                  mine
                    ? "bg-helper-600 text-white"
                    : "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                <p className={`mt-1 text-[11px] font-semibold ${mine ? "text-helper-100" : "text-slate-400"}`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </section>

      <form
        onSubmit={sendMessage}
        className="sticky bottom-0 flex gap-2 border-t border-slate-200 bg-white p-3 pb-[calc(12px+env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-950"
      >
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={!errand?.matched_helper_id}
          placeholder={errand?.matched_helper_id ? "메시지 입력" : "매칭 후 채팅할 수 있습니다"}
          className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending || !errand?.matched_helper_id}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-helper-600 text-white disabled:bg-slate-300"
          aria-label="보내기"
        >
          <Send size={19} />
        </button>
      </form>
    </main>
  );
}
