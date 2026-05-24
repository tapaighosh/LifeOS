export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6 animate-pulse">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        {/* Greeting */}
        <div className="space-y-2">
          <div className="h-7 bg-zinc-800/50 rounded-lg w-64" />
          <div className="h-4 bg-zinc-800/30 rounded w-40" />
        </div>
        {/* Energy card */}
        <div className="h-20 bg-zinc-800/50 rounded-2xl" />
        {/* Plan */}
        <div className="space-y-3">
          <div className="h-4 bg-zinc-800/30 rounded w-32" />
          <div className="h-24 bg-zinc-800/50 rounded-2xl" />
          <div className="h-24 bg-zinc-800/50 rounded-2xl" />
          <div className="h-12 bg-zinc-800/30 rounded-2xl" />
        </div>
        {/* Challenges */}
        <div className="space-y-2">
          <div className="h-4 bg-zinc-800/30 rounded w-40" />
          <div className="h-14 bg-zinc-800/50 rounded-xl" />
          <div className="h-14 bg-zinc-800/50 rounded-xl" />
        </div>
        {/* Pillar bars */}
        <div className="h-28 bg-zinc-800/50 rounded-2xl" />
      </div>
    </div>
  );
}
