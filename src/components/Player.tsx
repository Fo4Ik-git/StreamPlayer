'use client';

import { useStore } from '@/store/useStore';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';

// Fix for Next.js 16 / TypeScript strictness with ReactPlayer
const ReactPlayerCast = ReactPlayer as any;

export default function Player() {
  const { currentVideo, playNext } = useStore();
  const [hasWindow, setHasWindow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHasWindow(true);
  }, []);

  if (!hasWindow) return <div className="w-full h-full bg-black rounded-xl animate-pulse" />;

  if (!currentVideo) {
    return (
      <div className="w-full h-full bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center justify-center text-zinc-500 gap-4">
        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center animate-pulse">
          <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-zinc-700 border-b-[10px] border-b-transparent ml-1" />
        </div>
        <p className="font-medium">Waiting for video requests...</p>
        <p className="text-sm opacity-50">Donations will appear here automatically</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
        <ReactPlayerCast
            url={currentVideo.url}
            width="100%"
            height="100%"
            playing={true}
            controls={true}
            onEnded={() => playNext()}
            onError={(e: any) => setError("Playback Error")} 
            // react-player/youtube config
            config={{
                youtube: {
                   // playerVars: { showinfo: 1 } // Deprecated and causes type error
                }
            }}
        />
        {error && (
            <div className="absolute inset-0 z-10 bg-black/80 flex items-center justify-center text-red-500 gap-2">
                <AlertCircle />
                <span>{error}</span>
            </div>
        )}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold text-white line-clamp-1">{currentVideo.title}</h3>
                <p className="text-zinc-400 text-sm mt-1">
                    Requested by <span className="text-indigo-400 font-medium">{currentVideo.requester}</span> 
                    {currentVideo.amount > 0 && ` • contributed ${currentVideo.amount}`}
                </p>
            </div>
             <button 
                onClick={() => playNext()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
             >
                Skip Video
            </button>
        </div>
    </div>
  );
}
