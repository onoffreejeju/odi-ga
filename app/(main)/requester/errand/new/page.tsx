"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, LocateFixed, MapPin, ShoppingCart, Star } from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import GooglePlaceInput from "@/components/GooglePlaceInput";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import type { LatLng } from "@/lib/googleMap";
import { createClient } from "@/lib/supabase/client";

const categories = [
  { id: "delivery", labelKo: "물건 전달", labelEn: "Delivery", Icon: Box },
  { id: "purchase", labelKo: "구매 대행", labelEn: "Purchase", Icon: ShoppingCart },
  { id: "pickup", labelKo: "픽업", labelEn: "Pickup", Icon: MapPin },
  { id: "etc", labelKo: "기타", labelEn: "Other", Icon: Star }
];

export default function NewErrandPage() {
  const router = useRouter();
  const { location, setLocation, error: locationError, loading, detect } = useCurrentLocation(true);
  const [category, setCategory] = useState("delivery");
  const [description, setDescription] = useState("");
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [dropoff, setDropoff] = useState<LatLng | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const needsDestination = category === "delivery";

  useEffect(() => {
    if (location && !pickupQuery) {
      setPickupQuery(location.name);
    }
  }, [location, pickupQuery]);

  const submit = async () => {
    if (!description || !location) {
      setMessage("설명과 심부름 위치를 입력하세요.");
      return;
    }
    if (needsDestination && !dropoff) {
      setMessage("배달 목적지를 입력하세요.");
      return;
    }

    const finalDropoff = needsDestination ? dropoff! : location;
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
      return;
    }

    let photoUrl: string | null = null;
    if (photo) {
      const path = `${data.user.id}/${crypto.randomUUID()}-${photo.name}`;
      const { error } = await supabase.storage.from("errand-photos").upload(path, photo);
      if (error) {
        setMessage(error.message);
        return;
      }
      photoUrl = supabase.storage.from("errand-photos").getPublicUrl(path).data.publicUrl;
    }

    const { data: inserted, error } = await supabase
      .from("errands")
      .insert({
        requester_id: data.user.id,
        category,
        description,
        photo_url: photoUrl,
        pickup_lat: location.lat,
        pickup_lng: location.lng,
        pickup_name: location.name,
        dropoff_lat: finalDropoff.lat,
        dropoff_lng: finalDropoff.lng,
        dropoff_name: finalDropoff.name
      })
      .select("id")
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push(`/errand/${inserted.id}`);
  };

  return (
    <main className="px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-requester-600">Requester</p>
          <h1 className="text-xl font-black text-slate-950 dark:text-white">심부름 요청</h1>
        </div>
        <button
          type="button"
          onClick={detect}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-requester-50 px-3 text-xs font-black text-requester-700"
        >
          <LocateFixed size={16} />
          현위치 사용
        </button>
      </div>

      <section className="mt-4 grid grid-cols-4 gap-2">
        {categories.map(({ id, labelKo, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategory(id)}
            className={`rounded-lg border p-2 text-center ${
              category === id
                ? "border-requester-500 bg-requester-50 text-requester-700"
                : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <Icon className="mx-auto" size={20} />
            <span className="mt-1 block text-[11px] font-black">{labelKo}</span>
          </button>
        ))}
      </section>

      <section className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <GoogleMap
          origin={location}
          destination={needsDestination ? dropoff : null}
          className="h-44"
          onMapClick={(point) => {
            setLocation(point);
            setPickupQuery(point.name);
          }}
        />
      </section>

      <section className="mt-3 space-y-2">
        <GooglePlaceInput
          value={pickupQuery}
          onChange={setPickupQuery}
          onPlaceSelect={(place) => {
            setLocation(place);
            setMessage("");
          }}
          placeholder={loading ? "현위치 확인 중" : locationError || "심부름 위치"}
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        {needsDestination ? (
          <GooglePlaceInput
            value={dropoffQuery}
            onChange={setDropoffQuery}
            onPlaceSelect={(place) => {
              setDropoff(place);
              setMessage("");
            }}
            placeholder="배달 목적지"
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        ) : null}
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="무엇을 도와드리면 될까요?"
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
          className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-900"
        />
      </section>

      {message ? <p className="mt-2 text-sm font-semibold text-red-500">{message}</p> : null}
      <button
        type="button"
        onClick={submit}
        className="mt-3 h-12 w-full rounded-lg bg-requester-600 text-base font-black text-white"
      >
        요청하기
      </button>
    </main>
  );
}
