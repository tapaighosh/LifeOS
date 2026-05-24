import { Sparkles } from 'lucide-react';

export function AIReviewCard({ observation, recommendation }: { observation: string, recommendation: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 p-6">
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
        <Sparkles className="w-3.5 h-3.5" />
        AI Generated
      </div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
        Weekly Insights
      </h3>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-indigo-300 mb-1">Observation</h4>
          <p className="text-zinc-300 text-sm leading-relaxed">{observation}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-pink-300 mb-1">Recommendation</h4>
          <p className="text-zinc-300 text-sm leading-relaxed">{recommendation}</p>
        </div>
      </div>
    </div>
  );
}
