'use client';

import { VideoItem } from '@/store/useStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, GripVertical, Trash2 } from 'lucide-react';

interface SortableQueueItemProps {
  video: VideoItem;
  onRemove: (id: string) => void;
}

export default function SortableQueueItem({ video, onRemove }: SortableQueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.queueId! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex gap-3 p-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 rounded-lg transition-all ${
        isDragging ? 'shadow-2xl ring-1 ring-indigo-500/50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center cursor-grab active:cursor-grabbing px-1 text-zinc-600 hover:text-zinc-400"
        title="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="w-24 aspect-video bg-black rounded overflow-hidden flex-shrink-0 relative">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-medium text-zinc-200 line-clamp-2 leading-tight group-hover:text-white transition-colors">
            {video.title}
          </h4>
          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
            <span className="text-indigo-400">{video.requester}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />{' '}
              {video.duration.replace('PT', '').replace('M', ':').replace('S', '')}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onRemove(video.queueId!)}
          className="text-zinc-500 hover:text-red-400 p-1"
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
