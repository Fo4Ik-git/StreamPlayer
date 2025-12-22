'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ListVideo, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import AddVideoForm from './AddVideoForm';
import SortableQueueItem from './SortableQueueItem';

export default function QueueList() {
  const { t } = useTranslation();
  const { queue, removeFromQueue, clearQueue, reorderQueue } = useStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((v) => v.queueId === active.id);
      const newIndex = queue.findIndex((v) => v.queueId === over.id);
      reorderQueue(oldIndex, newIndex);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ListVideo className="w-5 h-5 text-indigo-500" />
            {t('queue.title')} <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full">{queue.length}</span>
        </h3>
        <button 
            onClick={() => {
                if(confirm(t('queue.confirm_clear'))) clearQueue();
            }}
            className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex items-center gap-1"
            disabled={queue.length === 0}
        >
            <Trash2 className="w-3 h-3" /> {t('queue.clear')}
        </button>
      </div>
      
      <AddVideoForm />
      
      <div className="flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-300px)] p-2 space-y-2 custom-scrollbar">
        {queue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 gap-2 opacity-50">
                <ListVideo className="w-10 h-10" />
                <p className="text-sm">{t('queue.empty')}</p>
            </div>
        ) : (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            >
                <SortableContext 
                    items={queue.map(v => v.queueId!)} 
                    strategy={verticalListSortingStrategy}
                >
                    {queue.map((video) => (
                        <SortableQueueItem 
                            key={video.queueId} 
                            video={video} 
                            onRemove={removeFromQueue} 
                        />
                    ))}
                </SortableContext>
            </DndContext>
        )}
      </div>
    </div>
  );
}
