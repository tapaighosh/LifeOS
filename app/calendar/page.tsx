'use client';

import { useState, useEffect } from 'react';
import { EventCard } from '@/components/calendar/EventCard';
import { EventForm } from '@/components/calendar/EventForm';
import { Button } from '@/components/ui/Button';
import { Loader2, Plus, Calendar as CalIcon } from 'lucide-react';

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        setEvents([]);
        console.error('Failed to load events:', data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
      fetchEvents();
    } catch (e) {
      console.error(e);
    }
  };

  // Simple calendar grid generation for current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay(); // 0 = Sunday

  const calendarCells = [];
  // Empty cells before start
  for (let i = 0; i < startingDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="h-24 bg-zinc-900/20 border border-zinc-800/50 rounded-lg" />);
  }

  // Days
  for (let i = 1; i <= daysInMonth; i++) {
    const currentCellDate = new Date(year, month, i);
    // Find events overlapping with this day
    const dayEvents = events.filter(ev => {
      const start = new Date(ev.date_start);
      const end = new Date(ev.date_end);
      // Strip time
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return currentCellDate >= start && currentCellDate <= end;
    });

    const isToday = i === today.getDate();

    calendarCells.push(
      <div key={`day-${i}`} className={`h-24 p-2 border border-zinc-800 rounded-lg overflow-hidden flex flex-col ${isToday ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-zinc-900/40'}`}>
        <span className={`text-xs font-bold ${isToday ? 'text-indigo-400' : 'text-zinc-500'}`}>{i}</span>
        <div className="flex-1 mt-1 space-y-1 overflow-y-auto hide-scrollbar">
          {dayEvents.map(ev => (
            <div key={ev._id} className="text-[10px] truncate bg-zinc-800 text-zinc-300 px-1 rounded">
              {ev.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-10 px-4 pb-24 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
            <CalIcon className="h-8 w-8 text-indigo-400" />
            Calendar
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage events and block out your days.</p>
        </div>

        <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-500 gap-2">
          <Plus className="h-4 w-4" /> Something came up
        </Button>
      </div>

      {showForm && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <EventForm onSuccess={() => { setShowForm(false); fetchEvents(); }} />
        </div>
      )}

      {/* Monthly Grid */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
        <h2 className="text-lg font-bold text-zinc-200 mb-4">{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-zinc-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarCells}
        </div>
      </div>

      {/* Event List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-200 border-b border-zinc-800 pb-2">Upcoming Events</h2>
        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin text-zinc-500" /></div>
        ) : events.length === 0 ? (
          <p className="text-sm text-zinc-500">No events scheduled.</p>
        ) : (
          <div className="space-y-3">
            {events.map(ev => (
              <EventCard key={ev._id} event={ev} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
