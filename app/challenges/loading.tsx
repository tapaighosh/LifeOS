export default function ChallengesLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6 animate-pulse">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-5">
        <div className="h-7 bg-zinc-800/50 rounded-lg w-40" />
        <div className="h-10 bg-zinc-800/30 rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-zinc-800/50 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
