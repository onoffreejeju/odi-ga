"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, LocateFixed, MapPin, PackageCheck, Route, ShoppingCart, Star } from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import { createClient } from "@/lib/supabase/client";
import { distanceKm, toRelativeTime, type NearbyErrand } from "@/lib/location";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

const categoryMeta = {
  delivery: { label: "전달", Icon: Box },
  purchase: { label: "구매", Icon: ShoppingCart },
  pickup: { label: "픽업", Icon: MapPin },
  etc: { label: "기타", Icon: Star }
};

type ErrandRow = {
  id: string;
  category: string;
  description: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_name: string;
  created_at: string;
};

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"helper" | "requester">("helper");
  const [rows, setRows] = useState<ErrandRow[]>([]);
  const [message, setMessage] = useState("");
  const { location, error, loading, detect } = useCurrentLocation(true);
  const helperMode = mode === "helper";

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("errands")
        .select("id, category, description, pickup_lat, pickup_lng, pickup_name, created_at")
        .eq("status", "requested")
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) {
        setMessage(fetchError.message);
        return;
      }

      setRows((data || []) as ErrandRow[]);
    };

    load();
  }, []);

  const nearbyErrands = useMemo<NearbyErrand[]>(() => {
    if (!location) return [];

    return rows
      .map((row) => ({
        ...row,
        distanceKm: distanceKm(location, {
          lat: row.pickup_lat,
          lng: row.pickup_lng
        })
      }))
      .filter((row) => row.distanceKm <= 5)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [location, rows]);

  return (
    <main className="px-4 py-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">안녕하세요</p>
          <h1 className="text-xl font-black text-slate-950 dark:text-white">여행자님</h1>
        </div>
        <button
          type="button"
          onClick={detect}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-100 px-3 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <LocateFixed size={16} />
          현위치
        </button>
      </header>

      <section className="mt-4 grid grid-cols-2 rounded-lg bg-slate-200 p-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setMode("helper")}
          className={`h-10 rounded-md text-sm font-bold ${
            helperMode ? "bg-white text-helper-700 shadow-sm dark:bg-slate-950" : "text-slate-500"
          }`}
        >
          Helper
        </button>
        <button
          type="button"
          onClick={() => setMode("requester")}
          className={`h-10 rounded-md text-sm font-bold ${
            !helperMode
              ? "bg-white text-requester-700 shadow-sm dark:bg-slate-950"
              : "text-slate-500"
          }`}
        >
          Requester
        </button>
      </section>

      {helperMode ? (
        <>
          <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <GoogleMap
              origin={location}
              errands={nearbyErrands.map((errand) => ({
                id: errand.id,
                lat: errand.pickup_lat,
                lng: errand.pickup_lng,
                name: errand.pickup_name
              }))}
              className="h-56"
              zoom={13}
              onErrandClick={(point) => {
                if (point.id) router.push(`/errand/${point.id}`);
              }}
            />
          </section>

          <section className="mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">근처 요청</h2>
              <Link
                href="/helper/route/new"
                className="inline-flex items-center gap-1 rounded-lg bg-helper-600 px-3 py-2 text-xs font-black text-white"
              >
                <Route size={15} />
                경로 등록
              </Link>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {loading
                ? "현위치를 확인하는 중입니다."
                : location
                  ? "현위치 기준 5km 이내 요청입니다."
                  : error || "현위치를 사용하면 가까운 요청이 표시됩니다."}
            </p>
            {message ? <p className="mt-2 text-xs font-semibold text-red-500">{message}</p> : null}

            <div className="mt-3 space-y-2">
              {nearbyErrands.length ? (
                nearbyErrands.slice(0, 4).map((errand) => {
                  const meta = categoryMeta[errand.category as keyof typeof categoryMeta] || categoryMeta.etc;
                  const Icon = meta.Icon;

                  return (
                    <button
                      key={errand.id}
                      type="button"
                      onClick={() => router.push(`/errand/${errand.id}`)}
                      className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-requester-50 text-requester-600">
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-slate-950 dark:text-white">
                          {errand.description}
                        </span>
                        <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                          {meta.label} · {errand.distanceKm.toFixed(1)}km · {toRelativeTime(errand.created_at)}
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                  표시할 근처 요청이 없습니다.
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-4 rounded-lg bg-requester-600 p-5 text-white">
          <p className="text-sm font-semibold opacity-90">도움이 필요하다면</p>
          <h2 className="mt-2 text-2xl font-black">심부름을 요청해보세요</h2>
          <Link
            href="/requester/errand/new"
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-4 text-sm font-black text-slate-950"
          >
            <PackageCheck size={18} />
            심부름 요청하기
          </Link>
        </section>
      )}
    </main>
  );
}
