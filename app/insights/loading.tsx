export default function InsightsLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6 animate-pulse">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-5">
        <div className="h-7 bg-zinc-800/50 rounded-lg w-36" />
        <div className="h-48 bg-zinc-800/50 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-zinc-800/50 rounded-2xl" />)}
        </div>
        <div className="h-32 bg-zinc-800/50 rounded-2xl" />
        <div className="h-32 bg-zinc-800/50 rounded-2xl" />
      </div>
    </div>
  );
}
