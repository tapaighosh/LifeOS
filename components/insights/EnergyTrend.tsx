interface EnergyTrendProps {
  energyByDay: Array<{ date: string; avg: number | null }>;
}

export function EnergyTrend({ energyByDay }: EnergyTrendProps) {
  // Height calculated as percentage of max rating (5)
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-300 mb-4">Energy Trend</h3>
      <div className="h-32 flex items-end justify-between gap-1 mt-4">
        {energyByDay.map((day, i) => {
          const heightPct = day.avg ? (day.avg / 5) * 100 : 5; // give 5% min height if null for placeholder
          const d = new Date(day.date);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
              <div className="relative w-full flex justify-center h-full items-end">
                {day.avg && (
                  <span className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-zinc-300">
                    {day.avg.toFixed(1)}
                  </span>
                )}
                <div 
                  className={`w-full max-w-[24px] rounded-t-sm transition-all duration-500 ${day.avg ? 'bg-indigo-500' : 'bg-zinc-800 border-t border-zinc-700 border-dashed'}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 uppercase">{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
