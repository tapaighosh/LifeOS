import { IEventBlock } from '@/models/EventBlock';
import { Mountain, Plane, Bike, ChefHat, Coffee, Calendar as CalIcon, Trash2 } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  trek: Mountain,
  travel: Plane,
  bike_ride: Bike,
  cooking_exp: ChefHat,
  rest_day: Coffee,
  custom: CalIcon,
};

const COLOR_MAP: Record<string, string> = {
  trek: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  travel: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  bike_ride: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  cooking_exp: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  rest_day: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  custom: 'bg-zinc-800 text-zinc-300 border-zinc-700',
};

export function EventCard({ event, onDelete }: { event: IEventBlock, onDelete: (id: string) => void }) {
  const Icon = ICON_MAP[event.type] || CalIcon;
  const colorClass = COLOR_MAP[event.type] || COLOR_MAP.custom;

  // Format dates securely
  const startDate = new Date(event.date_start).toLocaleDateString();
  const endDate = new Date(event.date_end).toLocaleDateString();
  const isSingleDay = startDate === endDate;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${colorClass}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-black/20 rounded-md">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold">{event.label}</h4>
          <p className="text-xs opacity-80">
            {isSingleDay ? startDate : `${startDate} - ${endDate}`}
          </p>
          {event.impact && (
            <span className="inline-block mt-1 px-1.5 py-0.5 bg-black/20 rounded text-[10px] uppercase font-bold tracking-wider">
              {event.impact}
            </span>
          )}
        </div>
      </div>
      <button 
        onClick={() => event._id && onDelete(event._id.toString())}
        className="p-2 hover:bg-black/20 rounded-md transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
