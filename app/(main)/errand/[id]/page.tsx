"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MessageCircle, Star, UserCircle } from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import { createClient } from "@/lib/supabase/client";

const steps = ["requested", "matched", "in_progress", "completed"];
const labels = ["요청됨", "매칭됨", "진행중", "완료"];
const categoryLabels: Record<string, string> = {
  delivery: "물건 전달",
  purchase: "구매 대행",
  pickup: "픽업",
  etc: "기타"
};

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

type UserProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  level: number;
  rating_avg: number;
  total_helps: number;
};

export default function ErrandDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [errand, setErrand] = useState<Errand | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [usersById, setUsersById] = useState<Record<string, UserProfile>>({});
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

      const loadedErrand = data as Errand;
      const participantIds = [
        loadedErrand.requester_id,
        loadedErrand.matched_helper_id
      ].filter(Boolean) as string[];

      if (participantIds.length) {
        const { data: users } = await supabase
          .from("users")
          .select("id, name, avatar_url, level, rating_avg, total_helps")
          .in("id", participantIds);

        setUsersById(
          Object.fromEntries(
            ((users || []) as UserProfile[]).map((user) => [user.id, user])
          )
        );
      }
    };

    load();
  }, [params.id]);

  const helper = userId && errand?.matched_helper_id === userId;
  const requester = userId && errand?.requester_id === userId;
  const participant = Boolean(requester || helper);
  const currentIndex = Math.max(0, steps.indexOf(errand?.status || "requested"));
  const canAdvance = helper && (errand?.status === "matched" || errand?.status === "in_progress");
  const nextStatus = errand?.status === "matched" ? "in_progress" : "completed";
  const canChat = participant && Boolean(errand?.matched_helper_id);

  const updateStatus = async () => {
    if (!errand) return;
    const supabase = createClient();
    const { data, error } = await supabase.rpc("advance_errand_status", {
      p_errand_id: errand.id,
      p_next_status: nextStatus
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setErrand((data as Errand) || { ...errand, status: nextStatus });
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
  const requesterProfile = usersById[errand.requester_id];
  const helperProfile = errand.matched_helper_id ? usersById[errand.matched_helper_id] : null;
  const counterpart =
    requester && helperProfile
      ? { label: "헬퍼", profile: helperProfile }
      : helper && requesterProfile
        ? { label: "의뢰인", profile: requesterProfile }
        : null;
  const guide =
    errand.status === "requested"
      ? "헬퍼가 수락하면 채팅과 진행 상태를 사용할 수 있습니다."
      : helper && errand.status === "matched"
        ? "픽업을 마쳤다면 픽업 완료를 눌러 진행 상태로 바꾸세요."
        : helper && errand.status === "in_progress"
          ? "전달을 마쳤다면 전달 완료를 눌러 의뢰를 마무리하세요."
          : requester && errand.status !== "completed"
            ? "헬퍼와 채팅으로 세부 내용을 조율하세요."
            : "완료된 의뢰입니다. 평가를 남길 수 있습니다.";

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
          <p className="text-xs font-bold uppercase text-requester-600">
            {categoryLabels[errand.category] || errand.category}
          </p>
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
        <p className="text-sm font-black text-slate-950 dark:text-white">참여자</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ParticipantProfile label="의뢰인" profile={requesterProfile} active={requester} />
          <ParticipantProfile label="헬퍼" profile={helperProfile} active={helper} />
        </div>
        {counterpart ? (
          <p className="mt-3 text-xs font-bold text-slate-500">
            상대방: {counterpart.profile.name || counterpart.label}
          </p>
        ) : (
          <p className="mt-3 text-xs font-bold text-slate-500">
            아직 매칭된 헬퍼가 없습니다.
          </p>
        )}
        <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {guide}
        </p>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => router.push(`/chat/${errand.id}`)}
          disabled={!canChat}
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-black disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:disabled:bg-slate-900"
        >
          <MessageCircle size={18} />
          {canChat ? "채팅" : "매칭 대기"}
        </button>
        {canAdvance ? (
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

function ParticipantProfile({
  label,
  profile,
  active
}: {
  label: string;
  profile?: UserProfile | null;
  active: boolean | "" | null;
}) {
  return (
    <div
      className={`rounded-lg bg-white p-3 dark:bg-slate-950 ${
        active ? "ring-2 ring-helper-500" : ""
      }`}
    >
      <p className="text-xs font-black text-slate-400">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-500">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="" fill className="object-cover" />
          ) : (
            <UserCircle size={27} />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950 dark:text-white">
            {profile?.name || "대기 중"}
          </p>
          <p className="truncate text-[11px] font-bold text-slate-500">
            {profile
              ? `Lv.${profile.level} · ${profile.rating_avg.toFixed(1)}점 · ${profile.total_helps}회`
              : "매칭 후 표시"}
          </p>
        </div>
      </div>
    </div>
  );
}
