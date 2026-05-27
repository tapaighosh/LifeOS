/**
 * app/settings/loading.tsx
 * Skeleton placeholder while the settings page loads.
 */
export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6 animate-pulse">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-7 bg-zinc-800/50 rounded-lg w-28" />
          <div className="h-4 bg-zinc-800/30 rounded w-48" />
        </div>

        {/* Time preferences section */}
        <div className="space-y-3">
          <div className="h-5 bg-zinc-800/30 rounded w-36" />
          <div className="h-14 bg-zinc-800/50 rounded-xl" />
          <div className="h-14 bg-zinc-800/50 rounded-xl" />
          <div className="h-14 bg-zinc-800/50 rounded-xl" />
        </div>

        {/* Notification section */}
        <div className="space-y-3">
          <div className="h-5 bg-zinc-800/30 rounded w-32" />
          <div className="h-14 bg-zinc-800/50 rounded-xl" />
          <div className="h-14 bg-zinc-800/50 rounded-xl" />
        </div>

        {/* Pillar balance section */}
        <div className="h-36 bg-zinc-800/50 rounded-2xl" />

        {/* Save button */}
        <div className="h-11 bg-zinc-800/50 rounded-xl w-24" />
      </div>
    </div>
  );
}
