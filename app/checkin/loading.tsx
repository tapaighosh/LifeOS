export default function CheckInLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6 animate-pulse">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-5">
        <div className="h-7 bg-zinc-800/50 rounded-lg w-48" />
        <div className="h-4 bg-zinc-800/30 rounded w-64" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-zinc-800/50 rounded-2xl" />
        ))}
        <div className="h-28 bg-zinc-800/50 rounded-2xl" />
        <div className="h-12 bg-zinc-800/50 rounded-2xl" />
      </div>
    </div>
  );
}
