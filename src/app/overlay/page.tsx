'use client';

import Player from '@/components/Player';
import { useEffect, useState } from 'react';

export default function OverlayPage() {
    const [hasWindow, setHasWindow] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setHasWindow(true), 0);
        return () => clearTimeout(timer);
    }, []);
    
    if (!hasWindow) return null;

    return (
        <main className="w-full h-screen bg-transparent overflow-hidden">
            <Player />
        </main>
    );
}
