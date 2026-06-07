"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, Star, UserCircle } from "lucide-react";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type UserProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  language: string;
  role: "helper" | "requester" | "both";
  level: number;
  total_helps: number;
  rating_avg: number;
  created_at: string;
};

const roleLabels: Record<UserProfile["role"], string> = {
  helper: "헬퍼",
  requester: "의뢰인",
  both: "헬퍼 · 의뢰인"
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!hasSupabaseEnv()) {
        setMessage("Supabase 환경변수가 없어 프로필을 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        router.push("/login");
        return;
      }

      setEmail(auth.user.email || "");

      const { data, error } = await supabase
        .from("users")
        .select("id, name, avatar_url, language, role, level, total_helps, rating_avg, created_at")
        .eq("id", auth.user.id)
        .single();

      if (error) {
        const fallbackName =
          auth.user.user_metadata?.full_name ||
          auth.user.user_metadata?.name ||
          auth.user.email?.split("@")[0] ||
          "여행자님";

        setProfile({
          id: auth.user.id,
          name: fallbackName,
          avatar_url:
            auth.user.user_metadata?.avatar_url || auth.user.user_metadata?.picture || null,
          language: "ko",
          role: "both",
          level: 1,
          total_helps: 0,
          rating_avg: 0,
          created_at: new Date().toISOString()
        });
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setProfile(data as UserProfile);
      setLoading(false);
    };

    loadProfile().catch((error) => {
      setMessage(error.message);
      setLoading(false);
    });
  }, [router]);

  const signOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const displayName = profile?.name || email.split("@")[0] || "여행자님";
  const rating = profile?.rating_avg ? profile.rating_avg.toFixed(1) : "0.0";

  return (
    <main className="px-5 py-6">
      <header>
        <h1 className="text-2xl font-black text-slate-950 dark:text-white">프로필</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          계정 정보와 활동 신뢰도를 확인합니다.
        </p>
      </header>

      {message ? (
        <p className="mt-4 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-700">
          {message}
        </p>
      ) : null}

      <section className="mt-5 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="relative flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-helper-500 to-requester-600 text-white">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="" fill className="object-cover" />
            ) : (
              <UserCircle size={54} />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-black text-slate-950 dark:text-white">
              {loading ? "불러오는 중" : displayName}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-500">
              {email || "이메일 정보 없음"}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-helper-50 px-3 py-1 text-xs font-black text-helper-700">
              Level {profile?.level || 1} · {roleLabels[profile?.role || "both"]}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900">
          <Star className="text-yellow-500" fill="currentColor" size={22} />
          <p className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{rating}</p>
          <p className="text-xs font-bold text-slate-500">평균 평점</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900">
          <ShieldCheck className="text-helper-600" size={22} />
          <p className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
            {profile?.total_helps || 0}
          </p>
          <p className="text-xs font-bold text-slate-500">완료 도움</p>
        </div>
      </section>

      <section className="mt-4 rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm dark:border-slate-800">
          <span className="font-bold text-slate-500">언어</span>
          <span className="font-black text-slate-950 dark:text-white">
            {profile?.language === "en" ? "English" : "한국어"}
          </span>
        </div>
        <div className="flex items-center justify-between py-3 text-sm">
          <span className="font-bold text-slate-500">역할</span>
          <span className="font-black text-slate-950 dark:text-white">
            {roleLabels[profile?.role || "both"]}
          </span>
        </div>
      </section>

      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-white text-sm font-black text-red-600 disabled:opacity-60 dark:border-red-950 dark:bg-slate-900"
      >
        <LogOut size={18} />
        {signingOut ? "로그아웃 중" : "로그아웃"}
      </button>
    </main>
  );
}
