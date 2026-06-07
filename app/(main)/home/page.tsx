"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  HandHeart,
  MapPin,
  Package,
  PackageCheck,
  ShoppingCart,
  Star,
  UserCircle
} from "lucide-react";
import { hasSupabaseEnv } from "@/lib/env";
import { toRelativeTime } from "@/lib/location";
import { createClient } from "@/lib/supabase/client";

type RouteRow = {
  id: string;
  helper_id: string;
  origin_name: string;
  dest_name: string;
  departure_time: string;
};

type ErrandRow = {
  id: string;
  requester_id: string;
  category: "delivery" | "purchase" | "pickup" | "etc";
  description: string;
  pickup_name: string;
  created_at: string;
};

type UserRow = {
  id: string;
  name: string | null;
  avatar_url?: string | null;
};

const categoryMeta = {
  delivery: { label: "물건 전달", Icon: Package },
  purchase: { label: "구매 대행", Icon: ShoppingCart },
  pickup: { label: "픽업", Icon: MapPin },
  etc: { label: "기타", Icon: Star }
};

function formatDeparture(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "출발 시간 미정";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function HomePage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [errands, setErrands] = useState<ErrandRow[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserRow>>({});
  const [displayName, setDisplayName] = useState("여행자님");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadHome = async () => {
      if (!hasSupabaseEnv()) {
        setLoading(false);
        setMessage("Supabase 환경변수가 없어 실제 데이터를 불러오지 못했습니다.");
        return;
      }

      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();

      const [routesResult, errandsResult] = await Promise.all([
        supabase
          .from("routes")
          .select("id, helper_id, origin_name, dest_name, departure_time")
          .eq("status", "active")
          .order("departure_time", { ascending: true })
          .limit(5),
        supabase
          .from("errands")
          .select("id, requester_id, category, description, pickup_name, created_at")
          .eq("status", "requested")
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      if (routesResult.error || errandsResult.error) {
        setMessage(routesResult.error?.message || errandsResult.error?.message || "");
        setLoading(false);
        return;
      }

      const nextRoutes = (routesResult.data || []) as RouteRow[];
      const nextErrands = (errandsResult.data || []) as ErrandRow[];
      setRoutes(nextRoutes);
      setErrands(nextErrands);

      const userIds = Array.from(
        new Set([
          auth.user?.id,
          ...nextRoutes.map((route) => route.helper_id),
          ...nextErrands.map((errand) => errand.requester_id)
        ].filter(Boolean) as string[])
      );

      if (userIds.length) {
        const { data: users } = await supabase
          .from("users")
          .select("id, name, avatar_url")
          .in("id", userIds);

        const userMap = Object.fromEntries(
          ((users || []) as UserRow[]).map((user) => [user.id, user])
        );
        setUsersById(userMap);

        const currentUser = auth.user?.id ? userMap[auth.user.id] : null;
        setDisplayName(currentUser?.name || auth.user?.email?.split("@")[0] || "여행자님");
      }

      setLoading(false);
    };

    loadHome().catch((error) => {
      setMessage(error.message);
      setLoading(false);
    });
  }, []);

  const statsLabel = useMemo(() => {
    if (loading) return "불러오는 중";
    return `경로 ${routes.length}개 · 의뢰 ${errands.length}개`;
  }, [errands.length, loading, routes.length]);

  return (
    <main className="px-5 py-5">
      <header>
        <p className="text-sm font-black text-helper-600">어디:가</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
          안녕하세요, {displayName}
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">{statsLabel}</p>
        {message ? (
          <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-700">
            {message}
          </p>
        ) : null}
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => router.push("/helper/route/new")}
          className="flex h-16 items-center justify-center gap-2 rounded-lg bg-helper-600 text-base font-black text-white shadow-sm"
        >
          <HandHeart size={21} />
          헬퍼
        </button>
        <button
          type="button"
          onClick={() => router.push("/requester/errand/new")}
          className="flex h-16 items-center justify-center gap-2 rounded-lg bg-requester-600 text-base font-black text-white shadow-sm"
        >
          <PackageCheck size={21} />
          의뢰인
        </button>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">활동 중인 헬퍼</h2>
          <span className="text-xs font-bold text-slate-400">실시간 경로</span>
        </div>
        <div className="mt-3 space-y-3">
          {routes.map((route) => {
            const helper = usersById[route.helper_id];

            return (
              <button
                key={route.id}
                type="button"
                onClick={() => router.push("/requester/errand/new")}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <UserCircle className="shrink-0 text-helper-600" size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-950 dark:text-white">
                    {helper?.name || "헬퍼"}
                  </span>
                  <span className="mt-1 flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="truncate">{route.origin_name}</span>
                    <ArrowRight size={13} className="shrink-0" />
                    <span className="truncate">{route.dest_name}</span>
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-helper-600">
                  <Clock size={13} />
                  {formatDeparture(route.departure_time)}
                </span>
              </button>
            );
          })}
          {!loading && !routes.length ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              아직 등록된 헬퍼 경로가 없습니다.
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => router.push("/helper/route/new")}
          className="mt-3 h-11 w-full rounded-lg border border-slate-200 bg-white text-sm font-black text-helper-700 dark:border-slate-800 dark:bg-slate-900"
        >
          내 경로 등록하기
        </button>
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">요청 중인 의뢰</h2>
          <span className="text-xs font-bold text-slate-400">실시간 요청</span>
        </div>
        <div className="mt-3 space-y-3">
          {errands.map((errand) => {
            const meta = categoryMeta[errand.category] || categoryMeta.etc;
            const Icon = meta.Icon;

            return (
              <button
                key={errand.id}
                type="button"
                onClick={() => router.push(`/errand/${errand.id}`)}
                className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-requester-50 text-requester-600">
                  <Icon size={21} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-requester-600">
                      {meta.label}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {toRelativeTime(errand.created_at)}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-sm font-black text-slate-950 dark:text-white">
                    {errand.description}
                  </span>
                  <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                    {errand.pickup_name}
                  </span>
                </span>
              </button>
            );
          })}
          {!loading && !errands.length ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              아직 요청 중인 의뢰가 없습니다.
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => router.push("/requester/errand/new")}
          className="mt-3 h-11 w-full rounded-lg border border-slate-200 bg-white text-sm font-black text-requester-700 dark:border-slate-800 dark:bg-slate-900"
        >
          새 의뢰 등록하기
        </button>
      </section>
    </main>
  );
}
