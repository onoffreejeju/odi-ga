"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GoogleMap from "@/components/GoogleMap";
import ErrandCard from "@/components/ErrandCard";
import { createClient } from "@/lib/supabase/client";
import { matchErrands, type MatchedErrand } from "@/lib/matching";
import type { LatLng } from "@/lib/googleMap";

export default function MatchPage() {
  const router = useRouter();
  const [routeId, setRouteId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [errands, setErrands] = useState<MatchedErrand[]>([]);
  const [message, setMessage] = useState("매칭 가능한 요청을 불러오는 중입니다.");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }

      const { data: route } = await supabase
        .from("routes")
        .select("*")
        .eq("helper_id", auth.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!route) {
        setMessage("활성 경로가 없습니다. 먼저 경로를 등록하세요.");
        return;
      }

      setRouteId(route.id);
      setOrigin({ lat: route.origin_lat, lng: route.origin_lng, name: route.origin_name });
      setDestination({ lat: route.dest_lat, lng: route.dest_lng, name: route.dest_name });
      const matches = await matchErrands(route.id);
      setErrands(matches);
      setMessage(matches.length ? "" : "5km 이내 요청이 아직 없습니다.");
    };

    load().catch((error) => setMessage(error.message));
  }, [router]);

  const help = async (errandId: string) => {
    if (!routeId) return;
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("errands")
      .update({
        status: "matched",
        matched_route_id: routeId,
        matched_helper_id: auth.user?.id
      })
      .eq("id", errandId);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push(`/errand/${errandId}`);
  };

  return (
    <main className="flex min-h-screen flex-col">
      <GoogleMap
        origin={origin}
        destination={destination}
        errands={errands.map((errand) => ({
          lat: errand.pickup_lat,
          lng: errand.pickup_lng,
          name: errand.pickup_name
        }))}
        className="h-[45vh]"
      />
      <section className="-mt-4 flex-1 rounded-t-2xl bg-slate-50 px-5 py-5 dark:bg-slate-950">
        <h1 className="text-xl font-black text-slate-950 dark:text-white">근처 심부름</h1>
        {message ? <p className="mt-3 text-sm font-semibold text-slate-500">{message}</p> : null}
        <div className="mt-4 space-y-3">
          {errands.map((errand) => (
            <ErrandCard
              key={errand.errand_id}
              category={errand.category}
              description={errand.description}
              pickupName={errand.pickup_name}
              detourKm={errand.detour_km}
              requesterName={errand.requester_name}
              onHelp={() => help(errand.errand_id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
