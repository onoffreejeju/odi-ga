"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, MessageCircle, User } from "lucide-react";

const items = [
  { href: "/home", label: "홈", Icon: Home },
  { href: "/activity", label: "내 활동", Icon: ListChecks },
  { href: "/chat", label: "채팅", Icon: MessageCircle },
  { href: "/profile", label: "프로필", Icon: User }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-4 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold ${
              active ? "text-helper-600" : "text-slate-400"
            }`}
          >
            <Icon size={21} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
