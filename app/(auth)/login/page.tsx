"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

const errorMessages: Record<string, string> = {
  auth_callback_failed: "로그인 인증을 완료하지 못했습니다. Supabase OAuth 설정을 확인하세요.",
  missing_auth_code: "로그인 인증 코드가 없습니다. 다시 시도하세요."
};

function getRedirectTo() {
  const url = new URL(window.location.href);

  if (url.hostname === "127.0.0.1" || url.hostname === "::1") {
    url.hostname = "localhost";
  }

  return `${url.origin}/auth/callback`;
}

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<"google" | "kakao" | "">("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (errorDescription) {
      setMessage(decodeURIComponent(errorDescription));
      return;
    }

    if (error) {
      setMessage(errorMessages[error] || error);
    }
  }, []);

  const login = async (provider: "google" | "kakao") => {
    if (!hasSupabaseEnv()) {
      setMessage("Supabase 환경변수가 설정되지 않았습니다.");
      return;
    }

    setMessage("");
    setLoadingProvider(provider);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectTo()
        }
      });

      if (error) {
        setMessage(error.message);
        setLoadingProvider("");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인을 시작하지 못했습니다.");
      setLoadingProvider("");
    }
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
        {message ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">
            {message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => login("google")}
          disabled={Boolean(loadingProvider)}
          className="flex h-14 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-900 shadow-sm"
        >
          {loadingProvider === "google" ? "Google 연결 중" : "Google로 계속하기"}
        </button>
        <button
          type="button"
          onClick={() => login("kakao")}
          disabled={Boolean(loadingProvider)}
          className="flex h-14 w-full items-center justify-center rounded-lg bg-[#FEE500] text-base font-bold text-[#191919]"
        >
          {loadingProvider === "kakao" ? "Kakao 연결 중" : "Kakao로 계속하기"}
        </button>
      </section>

      <p className="pb-4 text-center text-sm font-medium text-slate-500">
        내가 가는 길 중에, 누군가를 돕는다
      </p>
    </main>
  );
}
