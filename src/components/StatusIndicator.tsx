'use client';

// import { useDonationListener } from '@/hooks/useDonationListener';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export default function StatusIndicator() {
    const {
        youtubeApiKey,
        donationAlertsToken,
        daConnectionStatus,
        donatexToken,
        dxConnectionStatus,
        isDAEnabled,
        isDXEnabled,
    } = useStore();
    const ytStatus = youtubeApiKey ? 'active' : 'inactive';

    let daStatusFinal: 'active' | 'inactive' | 'connecting' = 'inactive';
    let dxStatusFinal: 'active' | 'inactive' | 'connecting' = 'inactive';

    if (donationAlertsToken) {
        if (daConnectionStatus === 'connected') {
            daStatusFinal = 'active';
        } else if (daConnectionStatus === 'connecting') {
            daStatusFinal = 'connecting';
        } else {
            daStatusFinal = 'inactive';
        }
    }

    if (donatexToken) {
        if (dxConnectionStatus === 'connected') {
            dxStatusFinal = 'active';
        } else if (dxConnectionStatus === 'connecting') {
            dxStatusFinal = 'connecting';
        } else {
            dxStatusFinal = 'inactive';
        }
    }

    return (
        <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-full backdrop-blur-sm">
            <StatusDot
                label="DonationAlerts"
                status={daStatusFinal}
                isEnabled={isDAEnabled}
            />
            {isDAEnabled && isDXEnabled && <Separator />}
            <StatusDot
                label="Donation X"
                status={dxStatusFinal}
                isEnabled={isDXEnabled}
            />
            {(isDAEnabled || isDXEnabled) && youtubeApiKey && (
                <Separator />
            )}
            <StatusDot label="YouTube API" status={ytStatus} />
        </div>
    );
}

function Separator() {
    return <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-800" />;
}

function StatusDot({
    label,
    status,
    isEnabled = true,
}: {
    label: string;
    status: 'active' | 'inactive' | 'connecting';
    isEnabled?: boolean;
}) {
    if (!isEnabled) return null;

    return (
        <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
                {status === 'active' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                {status === 'connecting' && (
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                )}
                <span
                    className={cn(
                        'relative inline-flex rounded-full h-2.5 w-2.5',
                        status === 'active'
                            ? 'bg-emerald-500'
                            : status === 'connecting'
                            ? 'bg-yellow-500'
                            : 'bg-zinc-400 dark:bg-zinc-600'
                    )}
                ></span>
            </div>
            <span
                className={cn(
                    'text-xs font-medium',
                    status === 'active'
                        ? 'text-zinc-700 dark:text-zinc-300'
                        : status === 'connecting'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-zinc-500 dark:text-zinc-600'
                )}
            >
                {label}
            </span>
        </div>
    );
}
