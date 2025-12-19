'use client';

import { useStore } from '@/store/useStore';
import { Clock, ListVideo, Trash2 } from 'lucide-react';

export default function QueueList() {
  const { queue, removeFromQueue, playNext, clearQueue } = useStore();

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <h3 className="font-bold text-white flex items-center gap-2">
            <ListVideo className="w-5 h-5 text-indigo-500" />
            Queue <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-full">{queue.length}</span>
        </h3>
        <button 
            onClick={() => {
                if(confirm('Are you sure you want to clear the queue?')) clearQueue();
            }}
            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            disabled={queue.length === 0}
        >
            <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {queue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 opacity-50">
                <ListVideo className="w-10 h-10" />
                <p className="text-sm">Queue is empty</p>
            </div>
        ) : (
            queue.map((video, index) => (
            <div 
                key={`${video.id}-${index}`} 
                className="group flex gap-3 p-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 rounded-lg transition-all"
            >
                <div className="w-24 aspect-video bg-black rounded overflow-hidden flex-shrink-0 relative">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <h4 className="text-sm font-medium text-zinc-200 line-clamp-2 leading-tight group-hover:text-white transition-colors">
                            {video.title}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                             <span className="text-indigo-400">{video.requester}</span>
                             <span>•</span>
                             <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {video.duration.replace('PT','').replace('M',':').replace('S','')}</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-col justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => removeFromQueue(video.id)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                        title="Remove"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
}
