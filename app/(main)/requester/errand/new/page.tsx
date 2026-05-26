"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, MapPin, ShoppingCart, Star } from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import GooglePlaceInput from "@/components/GooglePlaceInput";
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
  const [category, setCategory] = useState("delivery");
  const [description, setDescription] = useState("");
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [dropoff, setDropoff] = useState<LatLng | null>(null);
  const [clickTarget, setClickTarget] = useState<"pickup" | "dropoff">("pickup");
  const [photo, setPhoto] = useState<File | null>(null);
  const [mapOpen, setMapOpen] = useState(true);
  const [message, setMessage] = useState("");

  const selectPoint = (point: LatLng) => {
    if (clickTarget === "pickup") {
      setPickup(point);
      setPickupQuery(point.name);
    } else {
      setDropoff(point);
      setDropoffQuery(point.name);
    }
    setMessage("");
  };

  const submit = async () => {
    if (!description || !pickup || !dropoff) {
      setMessage("설명, 픽업 위치, 드롭 위치를 입력하세요.");
      return;
    }

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
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_name: pickup.name,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
        dropoff_name: dropoff.name
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
    <main className="px-5 py-6">
      <h1 className="text-2xl font-black text-slate-950 dark:text-white">심부름 요청</h1>
      <p className="mt-1 text-sm font-semibold text-slate-500">Requester can start in English too.</p>

      <section className="mt-5 grid grid-cols-2 gap-3">
        {categories.map(({ id, labelKo, labelEn, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategory(id)}
            className={`rounded-lg border p-4 text-left ${
              category === id
                ? "border-requester-500 bg-requester-50 text-requester-700"
                : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <Icon size={23} />
            <span className="mt-3 block text-sm font-black">{labelKo}</span>
            <span className="text-xs font-semibold opacity-70">{labelEn}</span>
          </button>
        ))}
      </section>

      <section className="mt-5 space-y-3">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="무엇을 도와드리면 될까요?"
          rows={4}
          className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
          className="w-full rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </section>

      <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setMapOpen((value) => !value)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-black"
        >
          위치 선택
          <span>{mapOpen ? "접기" : "열기"}</span>
        </button>
        {mapOpen ? (
          <div>
            <GoogleMap origin={pickup} destination={dropoff} className="h-64" onMapClick={selectPoint} />
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setClickTarget("pickup")}
                  className={`h-10 rounded-md text-sm font-bold ${
                    clickTarget === "pickup" ? "bg-white text-helper-700 shadow-sm" : "text-slate-500"
                  }`}
                >
                  픽업 위치
                </button>
                <button
                  type="button"
                  onClick={() => setClickTarget("dropoff")}
                  className={`h-10 rounded-md text-sm font-bold ${
                    clickTarget === "dropoff" ? "bg-white text-red-600 shadow-sm" : "text-slate-500"
                  }`}
                >
                  드롭 위치
                </button>
              </div>
              <GooglePlaceInput
                value={pickupQuery}
                onChange={setPickupQuery}
                onPlaceSelect={(place) => {
                  setPickup(place);
                  setMessage("");
                }}
                placeholder="픽업 위치"
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <GooglePlaceInput
                value={dropoffQuery}
                onChange={setDropoffQuery}
                onPlaceSelect={(place) => {
                  setDropoff(place);
                  setMessage("");
                }}
                placeholder="드롭 위치"
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>
        ) : null}
      </section>

      {message ? <p className="mt-4 text-sm font-semibold text-red-500">{message}</p> : null}
      <button
        type="button"
        onClick={submit}
        className="mt-5 h-14 w-full rounded-lg bg-requester-600 text-base font-black text-white"
      >
        요청하기
      </button>
    </main>
  );
}
