'use client';

import DonationAlertsAuthHandler from '@/components/DonationAlertsAuthHandler';
import Player from '@/components/Player';
import QueueList from '@/components/QueueList';
import SettingsDashboard from '@/components/SettingsDashboard';
import StatusIndicator from '@/components/StatusIndicator';
import { useEffect, useState } from 'react';

export default function Home() {
  const [hasWindow, setHasWindow] = useState(false);
  
  useEffect(() => {
    setHasWindow(true);
  }, []);

  // Avoid hydration mismatch on initial render for stored values if critical
  // But here we just render components that handle it internally or are client side.
  // Actually, for the layout itself, it's fine.

  if (!hasWindow) return null;

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            StreamPlayer <span className="text-zinc-500 text-sm font-normal">v1.0</span>
        </h1>
        <StatusIndicator />
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className="lg:col-span-2 flex flex-col min-h-[400px]">
            <Player />
        </div>
        <div className="h-[500px] lg:h-auto">
            <QueueList />
        </div>
      </div>

      <SettingsDashboard />
      <DonationAlertsAuthHandler />
    </main>
  );
}
