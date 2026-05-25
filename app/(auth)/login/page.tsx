"use client";

import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const redirectTo =
  typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";

export default function LoginPage() {
  const login = async (provider: "google" | "kakao") => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo
      }
    });
  };

  return (
    <main className="flex min-h-screen flex-col justify-between px-6 py-10">
      <section className="pt-12">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-helper-500 text-white">
          <MapPin size={34} />
        </div>
        <p className="text-sm font-semibold text-helper-600">ODI:GA</p>
        <h1 className="mt-2 text-4xl font-black tracking-normal text-slate-950 dark:text-white">
          어디:가
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
          이동 경로를 나누고 필요한 심부름을 가까운 사람과 연결합니다.
        </p>
      </section>

      <section className="space-y-3">
        <button
          type="button"
          onClick={() => login("google")}
          className="flex h-14 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-900 shadow-sm"
        >
          Google로 계속하기
        </button>
        <button
          type="button"
          onClick={() => login("kakao")}
          className="flex h-14 w-full items-center justify-center rounded-lg bg-[#FEE500] text-base font-bold text-[#191919]"
        >
          Kakao로 계속하기
        </button>
      </section>

      <p className="pb-4 text-center text-sm font-medium text-slate-500">
        내가 가는 길 중에, 누군가를 돕는다
      </p>
    </main>
  );
}
