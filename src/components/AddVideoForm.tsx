'use client';

import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useYoutubeValidator } from '../hooks/useYoutubeValidator';
import { useStore } from '../store/useStore';

export default function AddVideoForm() {
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { validateVideo, isValidating } = useYoutubeValidator();
    const { addToQueue } = useStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!url.trim()) return;

        const result = await validateVideo(url);

        if (result.isValid && result.videoDetails) {
            addToQueue({
                ...result.videoDetails,
                requester: 'Admin',
                amount: 0,
                addedAt: Date.now()
            });
            setUrl('');
        } else {
            setError(result.error || 'Failed to add video');
        }
    };

    return (
        <div className="bg-zinc-900/50 p-4 border-b border-zinc-800">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Paste YouTube URL here..."
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            if (error) setError(null);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 pr-10 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        disabled={isValidating}
                    />
                    <button
                        type="submit"
                        disabled={isValidating || !url.trim()}
                        className="absolute right-1 top-1 bottom-1 px-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded transition-colors flex items-center justify-center min-w-[32px]"
                    >
                        {isValidating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                    </button>
                </div>
                {error && (
                    <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{error}</span>
                    </div>
                )}
            </form>
        </div>
    );
}
