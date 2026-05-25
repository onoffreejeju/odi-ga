import BottomNav from "@/components/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="safe-bottom min-h-screen bg-slate-50 dark:bg-slate-950">
      {children}
      <BottomNav />
    </div>
  );
}
