'use client';

import {
    Plus,
    Save,
    Settings,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useStore } from '../store/useStore';

interface FiltersDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FiltersDashboard({isOpen, onClose}: FiltersDashboardProps) {
    const store = useStore();
    const { t } = useTranslation();
    const [newKeyword, setNewKeyword] = useState('');

    const handleSave = () => {
        onClose();
        toast.success(t('settings.saved'));
    };


    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-6 h-6 text-indigo-500" />
                        {t('filters.title')}
                    </h2>
                    <button
                        onClick={() => onClose()}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-8">

                    {/* Filters Section */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                            {t('filters.title')}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    {t('filters.min_donation')}
                                </label>
                                <input
                                    type="number"
                                    value={store.minDonationAmount}
                                    onChange={(e) =>
                                        store.setSettings({
                                            minDonationAmount: Number(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    {t('filters.min_views')}
                                </label>
                                <input
                                    type="number"
                                    value={store.minViewCount}
                                    onChange={(e) =>
                                        store.setSettings({
                                            minViewCount: Number(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    {t('filters.min_likes')}
                                </label>
                                <input
                                    type="number"
                                    value={store.minLikeCount}
                                    onChange={(e) =>
                                        store.setSettings({
                                            minLikeCount: Number(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Notifications Section */}

                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                    {/* Blacklist Section */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                            {t('filters.blacklistWords')}
                        </h3>
                        <div className="flex gap-2">
                            <input
                                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                placeholder="e.g. 'cringe', 'banned'"
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newKeyword) {
                                        store.addBlacklistedKeyword(newKeyword);
                                        setNewKeyword('');
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    if (newKeyword) {
                                        store.addBlacklistedKeyword(newKeyword);
                                        setNewKeyword('');
                                    }
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {store.blacklistedKeywords.map((keyword) => (
                                <span
                                    key={keyword}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-sm text-zinc-900 dark:text-white"
                                >
                                    {keyword}
                                    <button
                                        onClick={() =>
                                            store.removeBlacklistedKeyword(
                                                keyword
                                            )
                                        }
                                        className="hover:text-red-400"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            {store.blacklistedKeywords.length === 0 && (
                                <p className="text-sm text-zinc-600 italic">
                                    No blacklisted keywords.
                                </p>
                            )}
                        </div>
                    </section>
                </div>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Save className="w-4 h-4" />
                        {t('settings.save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
