'use client';

import { useDonationListener } from '@/hooks/useDonationListener';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export default function StatusIndicator() {
  const { daStatus, dxStatus } = useDonationListener();
  const { youtubeApiKey, donationAlertsToken } = useStore();
  const ytStatus = youtubeApiKey ? 'active' : 'inactive';
  
  // DonationAlerts is active if token exists
  const daStatusFinal = donationAlertsToken ? 'active' : 'inactive';

  return (
    <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-full backdrop-blur-sm">
      <StatusDot label="DonationAlerts" status={daStatusFinal} />
      <div className="w-px h-4 bg-zinc-800" />
      {/* <StatusDot label="Donation X" status={dxStatus} />
      <div className="w-px h-4 bg-zinc-800" /> */}
      <StatusDot label="YouTube API" status={ytStatus} />
    </div>
  );
}

function StatusDot({ label, status }: { label: string, status: 'active' | 'inactive' }) {
    return (
        <div className="flex items-center gap-2">
             <div className="relative flex h-2.5 w-2.5">
                {status === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={cn(
                    "relative inline-flex rounded-full h-2.5 w-2.5",
                    status === 'active' ? "bg-emerald-500" : "bg-zinc-600"
                )}></span>
            </div>
            <span className={cn(
                "text-xs font-medium",
                status === 'active' ? "text-zinc-300" : "text-zinc-600"
            )}>{label}</span>
        </div>
    )
}
