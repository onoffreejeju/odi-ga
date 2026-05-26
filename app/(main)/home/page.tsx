"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, MapPin, Package, ShoppingCart, Star } from "lucide-react";

const helpers = [
  { id: "helper-1", name: "김민수", origin: "서울역", destination: "제주공항", time: "오늘 14:00" },
  { id: "helper-2", name: "이수진", origin: "강남역", destination: "부산역", time: "오늘 15:30" },
  { id: "helper-3", name: "박지훈", origin: "홍대입구", destination: "인천공항", time: "오늘 16:00" },
  { id: "helper-4", name: "최유나", origin: "판교", destination: "대전역", time: "오늘 17:00" },
  { id: "helper-5", name: "정태우", origin: "잠실", destination: "수원역", time: "오늘 18:30" }
];

const requests = [
  { id: "request-1", category: "물건전달", description: "서류 봉투 전달 부탁드려요", location: "강남역 근처", time: "10분 전" },
  { id: "request-2", category: "구매대행", description: "편의점에서 우산 하나 사다주세요", location: "홍대입구", time: "25분 전" },
  { id: "request-3", category: "픽업", description: "카페에서 주문한 커피 픽업", location: "이태원", time: "30분 전" },
  { id: "request-4", category: "물건전달", description: "노트북 충전기 전달", location: "삼성역", time: "45분 전" },
  { id: "request-5", category: "기타", description: "우체국에서 등기 발송 부탁", location: "종로3가", time: "1시간 전" }
];

const requestIcons = {
  물건전달: Package,
  구매대행: ShoppingCart,
  픽업: MapPin,
  기타: Star
};

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"helper" | "requester">("helper");
  const helperSelected = activeTab === "helper";

  return (
    <main className="px-5 py-5">
      <header>
        <p className="text-sm font-black text-helper-600">어디:가</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
          안녕하세요, 여행자님
        </h1>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("helper")}
          className={`h-14 rounded-md text-base font-black transition ${
            helperSelected
              ? "bg-helper-600 text-white shadow-sm"
              : "bg-helper-50 text-helper-700 dark:bg-helper-100"
          }`}
        >
          헬퍼
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("requester")}
          className={`h-14 rounded-md text-base font-black transition ${
            !helperSelected
              ? "bg-requester-600 text-white shadow-sm"
              : "bg-requester-50 text-requester-700 dark:bg-requester-100"
          }`}
        >
          의뢰인
        </button>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">
            {helperSelected ? "활동 중인 헬퍼" : "요청 중인 의뢰"}
          </h2>
          <span className="text-xs font-bold text-slate-400">테스트 데이터</span>
        </div>

        <div className="mt-3 space-y-3">
          {helperSelected
            ? helpers.map((helper) => (
                <button
                  key={helper.id}
                  type="button"
                  onClick={() => router.push(`/helper/route/new?demo=${helper.id}`)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-black text-slate-950 dark:text-white">
                      {helper.name}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-helper-600">
                      <Clock size={14} />
                      {helper.time}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    <span className="truncate">{helper.origin}</span>
                    <ArrowRight size={15} className="shrink-0 text-slate-400" />
                    <span className="truncate">{helper.destination}</span>
                  </div>
                </button>
              ))
            : requests.map((request) => {
                const Icon = requestIcons[request.category as keyof typeof requestIcons] || Star;

                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => router.push(`/requester/errand/new?demo=${request.id}`)}
                    className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-requester-50 text-requester-600">
                      <Icon size={21} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-requester-600">
                          {request.category}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{request.time}</span>
                      </span>
                      <span className="mt-1 block truncate text-sm font-black text-slate-950 dark:text-white">
                        {request.description}
                      </span>
                      <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                        {request.location}
                      </span>
                    </span>
                  </button>
                );
              })}
        </div>

        <button
          type="button"
          onClick={() => router.push(helperSelected ? "/helper/route/new" : "/requester/errand/new")}
          className="mt-4 h-12 w-full rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          더 보기
        </button>
      </section>
    </main>
  );
}
