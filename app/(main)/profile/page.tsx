export default function ProfilePage() {
  return (
    <main className="px-5 py-6">
      <h1 className="text-2xl font-black text-slate-950 dark:text-white">프로필</h1>
      <section className="mt-5 rounded-lg bg-white p-5 shadow-sm dark:bg-slate-900">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-helper-500 to-requester-600" />
        <p className="mt-4 text-lg font-black text-slate-950 dark:text-white">여행자님</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">Level 1 헬퍼</p>
      </section>
    </main>
  );
}
