"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, LocateFixed, MapPin, ShoppingCart, Star } from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import GooglePlaceInput from "@/components/GooglePlaceInput";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import type { LatLng } from "@/lib/googleMap";
import { createClient } from "@/lib/supabase/client";
import { distanceKm, toRelativeTime, type NearbyErrand } from "@/lib/location";

const categoryMeta = {
  delivery: { label: "물건 전달", Icon: Box },
  purchase: { label: "구매 대행", Icon: ShoppingCart },
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

export default function NewRoutePage() {
  const router = useRouter();
  const { location, error: locationError, loading, detect } = useCurrentLocation(true);
  const [rows, setRows] = useState<ErrandRow[]>([]);
  const [destQuery, setDestQuery] = useState("");
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [departureTime, setDepartureTime] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!departureTime) {
      const soon = new Date(Date.now() + 30 * 60000);
      soon.setMinutes(Math.ceil(soon.getMinutes() / 5) * 5);
      setDepartureTime(soon.toISOString().slice(0, 16));
    }
  }, [departureTime]);

  useEffect(() => {
    const loadErrands = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("errands")
        .select("id, category, description, pickup_lat, pickup_lng, pickup_name, created_at")
        .eq("status", "requested")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error) {
        setRows((data || []) as ErrandRow[]);
      }
    };

    loadErrands();
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

  const submit = async () => {
    if (!location || !destination || !departureTime) {
      setMessage("현위치와 도착지를 확인하세요.");
      return;
    }

    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("routes").insert({
      helper_id: data.user.id,
      origin_lat: location.lat,
      origin_lng: location.lng,
      origin_name: location.name,
      dest_lat: destination.lat,
      dest_lng: destination.lng,
      dest_name: destination.name,
      departure_time: departureTime
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/helper/match");
  };

  return (
    <main className="px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-helper-600">헬퍼</p>
          <h1 className="text-xl font-black text-slate-950 dark:text-white">경로 등록</h1>
        </div>
        <button
          type="button"
          onClick={detect}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-helper-50 px-3 text-xs font-black text-helper-700"
        >
          <LocateFixed size={16} />
          현위치 사용
        </button>
      </div>

      <section className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <GoogleMap
          origin={location}
          destination={destination}
          errands={nearbyErrands.map((errand) => ({
            id: errand.id,
            lat: errand.pickup_lat,
            lng: errand.pickup_lng,
            name: errand.pickup_name
          }))}
          className="h-52"
          onMapClick={(point) => {
            setDestination(point);
            setDestQuery(point.name);
          }}
          onErrandClick={(point) => {
            if (point.id) router.push(`/errand/${point.id}`);
          }}
        />
      </section>

      <section className="mt-3 space-y-2">
        <div className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-900">
          <p className="text-xs font-bold text-slate-500">출발지</p>
          <p className="truncate text-sm font-black text-slate-950 dark:text-white">
            {loading ? "현위치를 확인하는 중" : location?.name || locationError || "현위치를 사용하세요"}
          </p>
        </div>
        <GooglePlaceInput
          value={destQuery}
          onChange={setDestQuery}
          onPlaceSelect={(place) => {
            setDestination(place);
            setMessage("");
          }}
          placeholder="도착지"
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          type="datetime-local"
          value={departureTime}
          onChange={(event) => setDepartureTime(event.target.value)}
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        {message ? <p className="text-sm font-semibold text-red-500">{message}</p> : null}
        <button
          type="button"
          onClick={submit}
          className="h-12 w-full rounded-lg bg-helper-600 text-base font-black text-white"
        >
          경로 등록
        </button>
      </section>

      <section className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-950 dark:text-white">근처 의뢰</h2>
          <span className="text-xs font-bold text-slate-400">{nearbyErrands.length}건</span>
        </div>
        <div className="mt-2 space-y-2">
          {nearbyErrands.slice(0, 3).map((errand) => {
            const meta = categoryMeta[errand.category as keyof typeof categoryMeta] || categoryMeta.etc;
            const Icon = meta.Icon;

            return (
              <button
                key={errand.id}
                type="button"
                onClick={() => router.push(`/errand/${errand.id}`)}
                className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-requester-50 text-requester-600">
                  <Icon size={18} />
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
          })}
          {!nearbyErrands.length ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              현위치 근처 의뢰가 없습니다.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
