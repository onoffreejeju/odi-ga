"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed } from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import GooglePlaceInput from "@/components/GooglePlaceInput";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import type { LatLng } from "@/lib/googleMap";
import { createClient } from "@/lib/supabase/client";

export default function NewRoutePage() {
  const router = useRouter();
  const { location, setLocation, error: locationError, loading, detect } = useCurrentLocation(true);
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
    <main className="flex min-h-screen flex-col">
      <GoogleMap
        origin={location}
        destination={destination}
        className="h-[44vh]"
        onMapClick={(point) => {
          setDestination(point);
          setDestQuery(point.name);
        }}
      />
      <section className="-mt-3 rounded-t-2xl bg-white px-5 py-4 shadow-soft dark:bg-slate-950">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-helper-600">Helper</p>
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

        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-slate-100 px-3 py-3 dark:bg-slate-900">
            <p className="text-xs font-bold text-slate-500">출발지</p>
            <p className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">
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
            placeholder="도착지 입력"
            className="h-12 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />

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
            className="h-12 w-full rounded-lg bg-helper-600 text-base font-black text-white"
          >
            경로 등록
          </button>
        </div>
      </section>
    </main>
  );
}
