'use client';

/**
 * QueueItemList — Drag-to-reorder list using @dnd-kit/sortable
 *
 * WHY drag-to-reorder only for pending/skipped:
 *   Covered items represent completed history — their order reflects the actual
 *   sequence in which topics were studied. Allowing reorder would corrupt that
 *   record. The API also enforces this with a 400 guard on covered items.
 *
 * Uses @dnd-kit/sortable which is already installed in this project.
 */

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ITopicItem } from '@/models/TopicItem';
import { TopicItemCard } from './TopicItemCard';

// ─── Sortable Item Wrapper ────────────────────────────────────────────────────

function SortableItem({
  item,
  isDsa,
  onUpdate,
}: {
  item: ITopicItem & { _id: string };
  isDsa: boolean;
  onUpdate: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2 last:mb-0">
      <TopicItemCard
        item={item}
        draggable
        isDsa={isDsa}
        onUpdate={onUpdate}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLSpanElement>}
      />
    </div>
  );
}

// ─── QueueItemList ────────────────────────────────────────────────────────────

interface QueueItemListProps {
  items: (ITopicItem & { _id: string })[];
  queueId: string;
  isDsa?: boolean;
  onItemUpdated: () => void;
}

export function QueueItemList({ items, queueId, isDsa = false, onItemUpdated }: QueueItemListProps) {
  const [localItems, setLocalItems] = useState(items);
  const [reordering, setReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localItems.findIndex((i) => i._id === active.id);
    const newIndex = localItems.findIndex((i) => i._id === over.id);
    const reordered = arrayMove(localItems, oldIndex, newIndex);

    setLocalItems(reordered);
    setReordering(true);

    try {
      const orderPayload = reordered.map((item, idx) => ({ id: item._id, order: idx }));
      const res = await fetch(`/api/queues/${queueId}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_id: queueId, items: orderPayload }),
      });

      if (!res.ok) {
        // Rollback on error
        setLocalItems(items);
        console.error('[QueueItemList] reorder failed');
      }
    } catch {
      setLocalItems(items);
    } finally {
      setReordering(false);
    }
  }

  if (localItems.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-600 text-sm">
        No items in this tab.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localItems.map((i) => i._id)} strategy={verticalListSortingStrategy}>
        <div className={reordering ? 'opacity-70 pointer-events-none' : ''}>
          {localItems.map((item) => (
            <SortableItem
              key={item._id}
              item={item}
              isDsa={isDsa}
              onUpdate={onItemUpdated}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
