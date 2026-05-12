export default function QueuesLoading() {
  return (
    <main className="max-w-2xl mx-auto pb-28 px-4 pt-6">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-zinc-800 animate-pulse" />
          <div className="h-7 w-40 rounded-lg bg-zinc-800 animate-pulse" />
        </div>
        <div className="h-4 w-32 rounded bg-zinc-800/60 animate-pulse" />
      </div>

      {/* Queue card skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 bg-zinc-900/50 border border-zinc-800/50 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-zinc-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-36 bg-zinc-800 rounded" />
                <div className="h-3 w-52 bg-zinc-800/60 rounded" />
              </div>
              <div className="w-16 h-5 bg-zinc-800 rounded-full" />
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full mb-2" />
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-zinc-800/60 rounded" />
              <div className="h-3 w-8 bg-zinc-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
