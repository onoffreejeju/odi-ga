"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import KakaoMap from "@/components/KakaoMap";
import { searchPlace, type LatLng } from "@/lib/kakaoMap";
import { createClient } from "@/lib/supabase/client";

export default function NewRoutePage() {
  const router = useRouter();
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [departureTime, setDepartureTime] = useState("");
  const [message, setMessage] = useState("");

  const findPlace = async (type: "origin" | "destination") => {
    const result = await searchPlace(type === "origin" ? originQuery : destQuery);
    if (!result) {
      setMessage("장소를 찾지 못했습니다.");
      return;
    }
    type === "origin" ? setOrigin(result) : setDestination(result);
    setMessage("");
  };

  const submit = async () => {
    if (!origin || !destination || !departureTime) {
      setMessage("출발지, 도착지, 출발 시간을 입력하세요.");
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
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      origin_name: origin.name,
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
    <main className="flex min-h-screen flex-col">
      <KakaoMap origin={origin} destination={destination} className="h-[60vh]" />
      <section className="-mt-4 rounded-t-2xl bg-white px-5 py-5 shadow-soft dark:bg-slate-950">
        <h1 className="text-xl font-black text-slate-950 dark:text-white">경로 등록</h1>
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={originQuery}
              onChange={(event) => setOriginQuery(event.target.value)}
              placeholder="출발지 검색"
              className="h-12 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <button className="rounded-lg bg-helper-600 px-4 text-sm font-bold text-white" onClick={() => findPlace("origin")}>
              검색
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={destQuery}
              onChange={(event) => setDestQuery(event.target.value)}
              placeholder="도착지 검색"
              className="h-12 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <button className="rounded-lg bg-red-500 px-4 text-sm font-bold text-white" onClick={() => findPlace("destination")}>
              검색
            </button>
          </div>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(event) => setDepartureTime(event.target.value)}
            className="h-12 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          {message ? <p className="text-sm font-semibold text-red-500">{message}</p> : null}
          <button
            type="button"
            onClick={submit}
            className="h-13 w-full rounded-lg bg-helper-600 py-4 text-base font-black text-white"
          >
            경로 등록
          </button>
        </div>
      </section>
    </main>
  );
}
