"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle } from "lucide-react";
import { hasSupabaseEnv } from "@/lib/env";
import { toRelativeTime } from "@/lib/location";
import { createClient } from "@/lib/supabase/client";

type ChatErrand = {
  id: string;
  description: string;
  pickup_name: string;
  dropoff_name: string;
  status: string;
  created_at: string;
  requester_id: string;
  matched_helper_id: string | null;
};

const statusLabels: Record<string, string> = {
  requested: "요청중",
  matched: "매칭됨",
  in_progress: "진행중",
  completed: "완료",
  cancelled: "취소됨"
};

export default function ChatPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatErrand[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadRooms = async () => {
      if (!hasSupabaseEnv()) {
        setMessage("Supabase 환경변수가 없어 채팅방을 불러오지 못했습니다.");
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

      const select =
        "id, description, pickup_name, dropoff_name, status, created_at, requester_id, matched_helper_id";
      const [requestedResult, helpingResult] = await Promise.all([
        supabase
          .from("errands")
          .select(select)
          .eq("requester_id", auth.user.id)
          .not("matched_helper_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("errands")
          .select(select)
          .eq("matched_helper_id", auth.user.id)
          .order("created_at", { ascending: false })
          .limit(30)
      ]);

      if (requestedResult.error || helpingResult.error) {
        setMessage(requestedResult.error?.message || helpingResult.error?.message || "");
        setLoading(false);
        return;
      }

      const uniqueRooms = new Map<string, ChatErrand>();
      [...(requestedResult.data || []), ...(helpingResult.data || [])].forEach((room) => {
        uniqueRooms.set(room.id, room as ChatErrand);
      });

      setRooms(
        Array.from(uniqueRooms.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      setLoading(false);
    };

    loadRooms().catch((error) => {
      setMessage(error.message);
      setLoading(false);
    });
  }, [router]);

  return (
    <main className="px-5 py-6">
      <header>
        <h1 className="text-2xl font-black text-slate-950 dark:text-white">채팅</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          매칭된 심부름의 대화를 확인합니다.
        </p>
      </header>

      {message ? (
        <p className="mt-4 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-700">
          {message}
        </p>
      ) : null}

      <section className="mt-5 space-y-3">
        {rooms.map((room) => {
          const mine = room.requester_id === userId;

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => router.push(`/chat/${room.id}`)}
              className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-helper-50 text-helper-600">
                <MessageCircle size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-black text-slate-950 dark:text-white">
                    {room.description}
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-slate-300" />
                </span>
                <span className="mt-2 block truncate text-xs font-semibold text-slate-500">
                  {mine ? "내가 요청한 의뢰" : "내가 맡은 의뢰"} · {statusLabels[room.status] || room.status}
                </span>
                <span className="mt-1 block truncate text-xs font-semibold text-slate-400">
                  {room.pickup_name} → {room.dropoff_name} · {toRelativeTime(room.created_at)}
                </span>
              </span>
            </button>
          );
        })}

        {!loading && !rooms.length ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
              아직 매칭된 채팅방이 없습니다.
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              의뢰가 매칭되면 여기에서 대화할 수 있습니다.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
