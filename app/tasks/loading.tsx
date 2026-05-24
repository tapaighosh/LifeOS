export default function TasksLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-6 animate-pulse">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-4">
        <div className="h-7 bg-zinc-800/50 rounded-lg w-32" />
        <div className="h-10 bg-zinc-800/30 rounded-2xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-zinc-800/50 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
