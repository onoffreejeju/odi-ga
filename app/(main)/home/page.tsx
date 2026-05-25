"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, PackageCheck, Route } from "lucide-react";

export default function HomePage() {
  const [mode, setMode] = useState<"helper" | "requester">("helper");
  const helperMode = mode === "helper";

  return (
    <main className="px-5 py-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">안녕하세요,</p>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">여행자님</h1>
        </div>
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-helper-500 to-requester-600" />
      </header>

      <section className="mt-6 grid grid-cols-2 rounded-lg bg-slate-200 p-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setMode("helper")}
          className={`h-11 rounded-md text-sm font-bold ${
            helperMode ? "bg-white text-helper-700 shadow-sm dark:bg-slate-950" : "text-slate-500"
          }`}
        >
          Helper 모드
        </button>
        <button
          type="button"
          onClick={() => setMode("requester")}
          className={`h-11 rounded-md text-sm font-bold ${
            !helperMode
              ? "bg-white text-requester-700 shadow-sm dark:bg-slate-950"
              : "text-slate-500"
          }`}
        >
          Requester 모드
        </button>
      </section>

      <section
        className={`mt-6 rounded-lg p-5 text-white ${
          helperMode ? "bg-helper-600" : "bg-requester-600"
        }`}
      >
        <p className="text-sm font-semibold opacity-90">
          {helperMode ? "가는 길이 있다면" : "도움이 필요하다면"}
        </p>
        <h2 className="mt-2 text-2xl font-black">
          {helperMode ? "경로를 등록하고 가까운 요청을 찾아보세요" : "심부름을 요청해보세요"}
        </h2>
        <Link
          href={helperMode ? "/helper/route/new" : "/requester/errand/new"}
          className="mt-5 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-4 text-sm font-black text-slate-950"
        >
          {helperMode ? <Route size={18} /> : <PackageCheck size={18} />}
          {helperMode ? "경로 등록하기" : "심부름 요청하기"}
          <ArrowRight size={17} />
        </Link>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-950 dark:text-white">
            {helperMode ? "진행 중 심부름" : "내 요청 목록"}
          </h3>
          <span className="text-xs font-bold text-slate-400">0건</span>
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-500">
            {helperMode
              ? "아직 진행 중인 심부름이 없습니다."
              : "아직 등록한 요청이 없습니다."}
          </p>
        </div>
      </section>
    </main>
  );
}
