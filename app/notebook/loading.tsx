/**
 * app/notebook/loading.tsx
 *
 * Shown by Next.js while the server component fetches data.
 * Mirrors the dimensions of NotebookTopicCard to prevent layout shift.
 */
export default function NotebookLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-24">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-36 bg-zinc-800/50 rounded-xl animate-pulse" />
        <div className="h-9 w-28 bg-zinc-800/50 rounded-xl animate-pulse" />
      </div>

      {/* Topic card skeletons */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 bg-zinc-800/50 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
