"use client";

import Link from "next/link";
import { HandHeart, PackageCheck } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-80px)] flex-col px-5 py-6">
      <header>
        <p className="text-sm font-black text-helper-600">어디:가</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
          안녕하세요, 여행자님
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          오늘은 어떤 역할로 시작할까요?
        </p>
      </header>

      <section className="flex flex-1 flex-col justify-center gap-4">
        <Link
          href="/helper/route/new"
          className="rounded-lg bg-helper-600 p-6 text-white shadow-soft"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15">
            <HandHeart size={28} />
          </div>
          <h2 className="mt-5 text-3xl font-black">헬퍼</h2>
          <p className="mt-2 text-sm font-semibold text-white/85">도움을 주고 싶을 때</p>
        </Link>

        <Link
          href="/requester/errand/new"
          className="rounded-lg bg-requester-600 p-6 text-white shadow-soft"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15">
            <PackageCheck size={28} />
          </div>
          <h2 className="mt-5 text-3xl font-black">의뢰인</h2>
          <p className="mt-2 text-sm font-semibold text-white/85">도움이 필요할 때</p>
        </Link>
      </section>
    </main>
  );
}
