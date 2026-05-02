'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

export function EventForm({ onSuccess }: { onSuccess: () => void }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('custom');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [impact, setImpact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        label,
        type,
        date_start: new Date(dateStart).toISOString(),
        date_end: new Date(dateEnd || dateStart).toISOString(), // fallback to start
        impact
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create');
      onSuccess();
      setLabel('');
      setDateStart('');
      setDateEnd('');
      setImpact('');
    } catch (err) {
      alert('Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Event Title</label>
        <input required value={label} onChange={e => setLabel(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-300" placeholder="e.g. Weekend Trek" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs text-zinc-500 mb-1 block">Start Date</label>
          <input required type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-300" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-zinc-500 mb-1 block">End Date (Optional)</label>
          <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} min={dateStart} className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-300" />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs text-zinc-500 mb-1 block">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-300">
            <option value="trek">Trek (Full Day)</option>
            <option value="travel">Travel (Multi-day)</option>
            <option value="bike_ride">Bike Ride (Half/Full)</option>
            <option value="cooking_exp">Cooking Exp (Evening)</option>
            <option value="rest_day">Rest Day</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-zinc-500 mb-1 block">Impact Level</label>
          <select value={impact} onChange={e => setImpact(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-sm text-zinc-300">
            <option value="">None</option>
            <option value="High">High (Disrupts schedule)</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-500">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Event Block'}
      </Button>
    </form>
  );
}
