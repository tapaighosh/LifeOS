/**
 * app/calendar/loading.tsx
 * Skeleton placeholder while the calendar page loads.
 */
export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6 animate-pulse">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-7 bg-zinc-800/50 rounded-lg w-40" />
          <div className="h-4 bg-zinc-800/30 rounded w-56" />
        </div>

        {/* Add event button skeleton */}
        <div className="h-11 bg-zinc-800/50 rounded-xl w-40" />

        {/* Event cards */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-zinc-800/50 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
