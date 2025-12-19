'use client';

import Player from '@/components/Player';
import { useEffect, useState } from 'react';

export default function OverlayPage() {
    const [hasWindow, setHasWindow] = useState(false);
    useEffect(() => setHasWindow(true), []);
    
    if (!hasWindow) return null;

    return (
        <div className="w-screen h-screen bg-transparent overflow-hidden">
             {/* 
                Overlay specific styling:
                Typically we want transparent background so obs can chroma key or just use alpha.
                But `bg-transparent` works if we set OBS source to transparent.
             */}
             <div className="w-full h-full flex flex-col">
                <div className="flex-1">
                    <Player />
                </div>
                {/* Minimal Info Bar if needed, but Player component already has info */}
             </div>
        </div>
    );
}
