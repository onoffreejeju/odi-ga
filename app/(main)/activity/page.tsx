"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, HandHeart, PackageCheck } from "lucide-react";
import { hasSupabaseEnv } from "@/lib/env";
import { toRelativeTime } from "@/lib/location";
import { createClient } from "@/lib/supabase/client";

type ActivityType = "requested" | "helping";
type StatusFilter = "all" | "requested" | "matched" | "in_progress" | "completed";

type ErrandRow = {
  id: string;
  category: string;
  description: string;
  pickup_name: string;
  dropoff_name: string;
  status: StatusFilter;
  created_at: string;
};

type ActivityItem = ErrandRow & {
  activityType: ActivityType;
};

const filters: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "전체" },
  { id: "requested", label: "요청중" },
  { id: "matched", label: "매칭됨" },
  { id: "in_progress", label: "진행중" },
  { id: "completed", label: "완료" }
];

const statusLabels: Record<StatusFilter, string> = {
  all: "전체",
  requested: "요청중",
  matched: "매칭됨",
  in_progress: "진행중",
  completed: "완료"
};

const statusClasses: Record<StatusFilter, string> = {
  all: "bg-slate-100 text-slate-600",
  requested: "bg-requester-50 text-requester-700",
  matched: "bg-helper-50 text-helper-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-slate-900 text-white"
};

export default function ActivityPage() {
  const router = useRouter();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadActivity = async () => {
      if (!hasSupabaseEnv()) {
        setMessage("Supabase 환경변수가 없어 활동을 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        router.push("/login");
        return;
      }

      const baseSelect =
        "id, category, description, pickup_name, dropoff_name, status, created_at";
      const [requestedResult, helpingResult] = await Promise.all([
        supabase
          .from("errands")
          .select(baseSelect)
          .eq("requester_id", auth.user.id)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("errands")
          .select(baseSelect)
          .eq("matched_helper_id", auth.user.id)
          .order("created_at", { ascending: false })
          .limit(30)
      ]);

      if (requestedResult.error || helpingResult.error) {
        setMessage(requestedResult.error?.message || helpingResult.error?.message || "");
        setLoading(false);
        return;
      }

      const requested = ((requestedResult.data || []) as ErrandRow[]).map((item) => ({
        ...item,
        activityType: "requested" as const
      }));
      const helping = ((helpingResult.data || []) as ErrandRow[]).map((item) => ({
        ...item,
        activityType: "helping" as const
      }));

      setItems(
        [...requested, ...helping].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      setLoading(false);
    };

    loadActivity().catch((error) => {
      setMessage(error.message);
      setLoading(false);
    });
  }, [router]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, items]);

  const counts = useMemo(
    () => ({
      requested: items.filter((item) => item.activityType === "requested").length,
      helping: items.filter((item) => item.activityType === "helping").length
    }),
    [items]
  );

  return (
    <main className="px-5 py-6">
      <header>
        <h1 className="text-2xl font-black text-slate-950 dark:text-white">내 활동</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          내가 요청한 의뢰와 맡은 의뢰를 확인합니다.
        </p>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-requester-50 p-4">
          <PackageCheck className="text-requester-600" size={22} />
          <p className="mt-2 text-2xl font-black text-requester-700">{counts.requested}</p>
          <p className="text-xs font-bold text-requester-700">요청한 의뢰</p>
        </div>
        <div className="rounded-lg bg-helper-50 p-4">
          <HandHeart className="text-helper-600" size={22} />
          <p className="mt-2 text-2xl font-black text-helper-700">{counts.helping}</p>
          <p className="text-xs font-bold text-helper-700">맡은 의뢰</p>
        </div>
      </section>

      <section className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActiveFilter(filter.id)}
            className={`h-9 shrink-0 rounded-lg px-3 text-xs font-black ${
              activeFilter === filter.id
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-500 dark:bg-slate-900"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </section>

      {message ? (
        <p className="mt-4 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-700">
          {message}
        </p>
      ) : null}

      <section className="mt-4 space-y-3">
        {filteredItems.map((item) => (
          <button
            key={`${item.activityType}-${item.id}`}
            type="button"
            onClick={() => router.push(`/errand/${item.id}`)}
            className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                item.activityType === "requested"
                  ? "bg-requester-50 text-requester-600"
                  : "bg-helper-50 text-helper-600"
              }`}
            >
              {item.activityType === "requested" ? (
                <PackageCheck size={20} />
              ) : (
                <HandHeart size={20} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-black text-slate-950 dark:text-white">
                  {item.description}
                </span>
                <ArrowRight size={16} className="shrink-0 text-slate-300" />
              </span>
              <span className="mt-2 flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="truncate">{item.pickup_name}</span>
                <ArrowRight size={12} className="shrink-0" />
                <span className="truncate">{item.dropoff_name}</span>
              </span>
              <span className="mt-3 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                    statusClasses[item.status] || statusClasses.all
                  }`}
                >
                  {statusLabels[item.status] || item.status}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                  <Clock size={13} />
                  {toRelativeTime(item.created_at)}
                </span>
              </span>
            </span>
          </button>
        ))}

        {!loading && !filteredItems.length ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
              표시할 활동이 없습니다.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => router.push("/requester/errand/new")}
                className="h-10 rounded-lg bg-requester-600 text-xs font-black text-white"
              >
                의뢰 등록
              </button>
              <button
                type="button"
                onClick={() => router.push("/helper/route/new")}
                className="h-10 rounded-lg bg-helper-600 text-xs font-black text-white"
              >
                경로 등록
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
