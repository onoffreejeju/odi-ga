import { Package, Pin, ShoppingCart, Star } from "lucide-react";

type ErrandCardProps = {
  category: string;
  description: string;
  pickupName: string;
  detourKm?: number;
  requesterName?: string;
  onHelp?: () => void;
};

const icons = {
  delivery: Package,
  purchase: ShoppingCart,
  pickup: Pin,
  etc: Star
};

export default function ErrandCard({
  category,
  description,
  pickupName,
  detourKm,
  requesterName = "Requester",
  onHelp
}: ErrandCardProps) {
  const Icon = icons[category as keyof typeof icons] || Star;
  const detourLabel =
    detourKm === undefined
      ? "거리 계산 전"
      : detourKm <= 1
        ? "가는 길 위에 있어요"
        : detourKm <= 3
          ? "조금만 돌아가면 돼요"
          : "약간 돌아가야 해요";
  const detourClass =
    detourKm === undefined
      ? "bg-slate-100 text-slate-500"
      : detourKm <= 1
        ? "bg-helper-100 text-helper-700"
        : detourKm <= 3
          ? "bg-yellow-100 text-yellow-700"
          : "bg-orange-100 text-orange-700";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-requester-50 text-requester-600">
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
              {requesterName}
            </p>
            {detourKm !== undefined ? (
              <span className="text-xs font-semibold text-slate-500">
                {detourKm.toFixed(1)}km
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
          <p className="mt-2 truncate text-xs font-medium text-slate-400">{pickupName}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${detourClass}`}>
          {detourLabel}
        </span>
        {onHelp ? (
          <button
            type="button"
            onClick={onHelp}
            className="rounded-lg bg-helper-600 px-4 py-2 text-sm font-bold text-white"
          >
            도와주기
          </button>
        ) : null}
      </div>
    </article>
  );
}
