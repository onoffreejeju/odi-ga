"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MessageCircle, Star } from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import { createClient } from "@/lib/supabase/client";

const steps = ["requested", "matched", "in_progress", "completed"];
const labels = ["요청됨", "매칭됨", "진행중", "완료"];

type Errand = {
  id: string;
  category: string;
  description: string;
  photo_url: string | null;
  pickup_lat: number;
  pickup_lng: number;
  pickup_name: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_name: string;
  status: string;
  requester_id: string;
  matched_helper_id: string | null;
};

export default function ErrandDetailPage({ params }: { params: { id: string } }) {
  const [errand, setErrand] = useState<Errand | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [thankMessage, setThankMessage] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? null);
      const { data, error } = await supabase
        .from("errands")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }
      setErrand(data);
    };

    load();
  }, [params.id]);

  const helper = userId && errand?.matched_helper_id === userId;
  const currentIndex = Math.max(0, steps.indexOf(errand?.status || "requested"));
  const nextStatus = errand?.status === "matched" ? "in_progress" : "completed";

  const updateStatus = async () => {
    if (!errand) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("errands")
      .update({ status: nextStatus })
      .eq("id", errand.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setErrand({ ...errand, status: nextStatus });
  };

  const submitReview = async () => {
    if (!errand || !userId) return;
    const revieweeId =
      userId === errand.requester_id ? errand.matched_helper_id : errand.requester_id;
    if (!revieweeId) return;

    const supabase = createClient();
    const { error } = await supabase.from("reviews").insert({
      errand_id: errand.id,
      reviewer_id: userId,
      reviewee_id: revieweeId,
      rating,
      thank_message: thankMessage
    });

    setMessage(error ? error.message : "평가가 저장되었습니다.");
  };

  if (!errand) {
    return <main className="p-5 text-sm font-semibold text-slate-500">{message || "불러오는 중"}</main>;
  }

  const pickup = {
    lat: errand.pickup_lat,
    lng: errand.pickup_lng,
    name: errand.pickup_name
  };
  const dropoff = {
    lat: errand.dropoff_lat,
    lng: errand.dropoff_lng,
    name: errand.dropoff_name
  };

  return (
    <main className="px-5 py-6">
      <h1 className="text-2xl font-black text-slate-950 dark:text-white">심부름 진행</h1>

      <section className="mt-6 flex items-center">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${
                index <= currentIndex ? "bg-helper-600 text-white" : "bg-slate-200 text-slate-400"
              }`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 ? (
              <div className={`h-1 flex-1 ${index < currentIndex ? "bg-helper-600" : "bg-slate-200"}`} />
            ) : null}
          </div>
        ))}
      </section>
      <div className="mt-2 grid grid-cols-4 text-center text-xs font-bold text-slate-500">
        {labels.map((label) => <span key={label}>{label}</span>)}
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <GoogleMap origin={pickup} destination={dropoff} className="h-64" />
        <div className="p-4">
          <p className="text-xs font-bold uppercase text-requester-600">{errand.category}</p>
          <p className="mt-2 text-base font-bold text-slate-950 dark:text-white">{errand.description}</p>
          {errand.photo_url ? (
            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-lg">
              <Image src={errand.photo_url} alt="" fill className="object-cover" />
            </div>
          ) : null}
          <div className="mt-4 space-y-2 text-sm font-semibold text-slate-500">
            <p>픽업: {errand.pickup_name}</p>
            <p>드롭: {errand.dropoff_name}</p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-lg bg-slate-100 p-4 dark:bg-slate-900">
        <p className="text-sm font-black text-slate-950 dark:text-white">상대방 프로필</p>
        <p className="mt-1 text-sm text-slate-500">매칭된 참여자 정보가 표시됩니다.</p>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-black dark:border-slate-700">
          <MessageCircle size={18} />
          채팅
        </button>
        {helper && errand.status !== "completed" ? (
          <button onClick={updateStatus} className="h-12 rounded-lg bg-helper-600 text-sm font-black text-white">
            {errand.status === "matched" ? "픽업 완료" : "전달 완료"}
          </button>
        ) : (
          <button className="h-12 rounded-lg bg-slate-200 text-sm font-black text-slate-500">
            상태 확인
          </button>
        )}
      </div>

      {errand.status === "completed" ? (
        <section className="celebrate mt-6 rounded-lg border border-helper-100 bg-helper-50 p-4">
          <h2 className="text-lg font-black text-helper-700">완료되었습니다</h2>
          <div className="mt-4 flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} onClick={() => setRating(value)} className={value <= rating ? "text-yellow-500" : "text-slate-300"}>
                <Star fill="currentColor" size={28} />
              </button>
            ))}
          </div>
          <textarea
            value={thankMessage}
            onChange={(event) => setThankMessage(event.target.value)}
            placeholder="감사 메시지를 남겨주세요"
            className="mt-3 w-full rounded-lg border border-helper-100 p-3 text-sm"
            rows={3}
          />
          <button onClick={submitReview} className="mt-3 h-11 w-full rounded-lg bg-helper-600 text-sm font-black text-white">
            평가 저장
          </button>
        </section>
      ) : null}

      {message ? <p className="mt-4 text-sm font-semibold text-slate-500">{message}</p> : null}
    </main>
  );
}
