'use client';

import {
  MediaPlayer,
  MediaProvider,
  type MediaPlayerInstance
} from '@vidstack/react';
import { useStore } from '../store/useStore';

import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { AlertCircle, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import '@vidstack/react/player/styles/default/layouts/video.css';
import '@vidstack/react/player/styles/default/theme.css';

export default function Player() {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const { 
    currentVideo, 
    playNext, 
    playPrevious, 
    isPlaying, 
    setIsPlaying, 
    volume, 
    setVolume,
    history 
  } = useStore();
  
  const [hasWindow, setHasWindow] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Guard against volume resets to 100% during track switches
  const volInitGuardRef = useRef<boolean>(false);

  useEffect(() => {
    // We defer this to avoid "setState in effect" lint error during hydration
    const timer = setTimeout(() => setHasWindow(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Track source changes since we removed the key
  useEffect(() => {
    if (currentVideo?.url) {
        // When a new video starts, we prevent the player from overwriting our volume
        volInitGuardRef.current = true;
        const timer = setTimeout(() => {
            setError(null);
            // Re-enforce the volume from store as soon as possible
            if (playerRef.current) {
                playerRef.current.volume = volume / 100;
            }
            // Release the guard after a short delay
            setTimeout(() => {
                volInitGuardRef.current = false;
            }, 2000);
        }, 0);
        return () => clearTimeout(timer);
    }
  }, [currentVideo?.url, volume]);

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
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl group">
          <MediaPlayer
            key={currentVideo.queueId}
            ref={playerRef}
            src={currentVideo.url}
            title={currentVideo.title}
            volume={volume / 100}
            muted={volume === 0}
            paused={!isPlaying}
            autoplay={isPlaying}
            crossorigin
            playsinline
            onCanPlay={() => {
              console.log("✅ Vidstack Ready");
              // Re-apply correct volume on ready
              if (playerRef.current) {
                playerRef.current.volume = volume / 100;
              }
            }}
            onPlay={() => {
                setIsPlaying(true);
            }}
            onPause={() => {
                setIsPlaying(false);
            }}
            onEnded={() => {
              playNext();
            }}
            onVolumeChange={(detail) => {
              // Sync Vidstack's volume back to our store ONLY if NOT dragging AND NOT during initialization
              if (!isDragging && !volInitGuardRef.current) {
                const newVol = Math.round(detail.volume * 100);
                
                // YouTube provider often resets to 100% on start - we must ignore this.
                if (newVol === 100 && volume !== 100) {
                    return;
                }

                // If store volume is 0 but player reports something small (up to 5%), 
                // it's likely a provider limitation or precision error, ignore it.
                if (volume === 0 && newVol <= 5) {
                    return;
                }

                if (Math.abs(newVol - volume) > 1) {
                  setVolume(newVol);
                }
              }
            }}
            onError={(detail: unknown) => {
              console.error("❌ Vidstack Error:", detail);
              setError("Playback Error: Video may be restricted or unavailable");
            }}
            className="w-full h-full"
          >
            <MediaProvider />
            <DefaultVideoLayout icons={defaultLayoutIcons} />
          </MediaPlayer>

          {error && (
              <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center text-white px-6 text-center flex-col gap-3">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                  <span className="font-medium">{error}</span>
                  <button 
                    onClick={() => playNext()}
                    className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                  >
                    Skip this video
                  </button>
              </div>
          )}
        </div>

        {/* Custom Mini Control Bar (Persistent sync with store) */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-4">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white line-clamp-1">{currentVideo.title}</h3>
                    <p className="text-zinc-400 text-sm mt-1">
                        Requested by <span className="text-indigo-400 font-medium">{currentVideo.requester}</span> 
                        {currentVideo.amount > 0 && ` • contributed ${currentVideo.amount}`}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-6 pt-2">
                {/* Playback Controls */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => playPrevious()}
                        disabled={history.length === 0}
                        className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                        title="Previous"
                    >
                        <SkipBack className="w-5 h-5 fill-current" />
                    </button>
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-12 h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-lg hover:scale-105 active:scale-95"
                    >
                        {isPlaying ? (
                            <Pause className="w-6 h-6 fill-current" />
                        ) : (
                            <Play className="w-6 h-6 fill-current ml-1" />
                        )}
                    </button>
                    <button 
                        onClick={() => playNext()}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                        title="Next"
                    >
                        <SkipForward className="w-5 h-5 fill-current" />
                    </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3 min-w-[150px]">
                    <button onClick={() => setVolume(volume === 0 ? 80 : 0)} className="text-zinc-400 hover:text-white transition-colors">
                        {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={volume} 
                        onChange={(e) => setVolume(parseInt(e.target.value))}
                        onMouseDown={() => setIsDragging(true)}
                        onMouseUp={() => setIsDragging(false)}
                        onTouchStart={() => setIsDragging(true)}
                        onTouchEnd={() => setIsDragging(false)}
                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                    />
                    <span className="text-zinc-500 text-xs tabular-nums w-8 text-right font-medium">
                        {volume}%
                    </span>
                </div>
            </div>
        </div>
    </div>
  );
}
