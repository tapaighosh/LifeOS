/**
 * app/recharge/loading.tsx
 * Skeleton placeholder while the recharge library page loads.
 */
export default function RechargeLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6 animate-pulse">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-7 bg-zinc-800/50 rounded-lg w-48" />
          <div className="h-4 bg-zinc-800/30 rounded w-64" />
        </div>

        {/* Add form skeleton */}
        <div className="h-14 bg-zinc-800/30 rounded-xl" />

        {/* Recharge items grid */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-zinc-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
