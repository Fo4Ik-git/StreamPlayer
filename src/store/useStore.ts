import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppState } from '../lib/interfaces';


export const useStore = create<AppState>()(
    persist(
        (set) => ({
            // Settings Initial State
            youtubeApiKey: '',
            donationAlertsToken: '',
            donationAlertsRefreshToken: '',
            donationAlertsTokenExpiry: 0,
            donationAlertsUserId: '',
            donationAlertsClientId: '',
            donationAlertsClientSecret: '',
            donationXApiKey: '',
            daConnectionStatus: 'disconnected',
            theme: 'dark',

            // YouTube Video Filter Initial State
            minDonationAmount: 100,
            minViewCount: 50000,
            minLikeCount: 10000,
            blacklistedUrls: [],
            blacklistedKeywords: [],

            // Queue Initial State
            queue: [],
            currentVideo: null,
            history: [],
            isPlaying: false,
            volume: 80,

            // Notifications Initial State
            donationAlertsNotifications: true,
            youtubeVideoNotifications: true,

            // Actions
            setSettings: (newSettings) => {
                console.log('[Store] setSettings called with:', newSettings);
                set((state) => {
                    const newState = { ...state, ...newSettings };
                    console.log('[Store] New state after merge:', {
                        hasToken: !!newState.donationAlertsToken,
                        tokenLength: newState.donationAlertsToken?.length,
                        userId: newState.donationAlertsUserId,
                    });
                    return newState;
                });
            },

            setDAConnectionStatus: (status) =>
                set({ daConnectionStatus: status }),

            setTheme: (theme) => set({ theme }),

            addBlacklistedUrl: (url: string) =>
                set((state) => ({
                    blacklistedUrls: [...state.blacklistedUrls, url],
                })),

            removeBlacklistedUrl: (url: string) =>
                set((state) => ({
                    blacklistedUrls: state.blacklistedUrls.filter(
                        (u) => u !== url
                    ),
                })),

            addBlacklistedKeyword: (keyword: string) =>
                set((state) => ({
                    blacklistedKeywords: [
                        ...state.blacklistedKeywords,
                        keyword,
                    ],
                })),

            removeBlacklistedKeyword: (keyword: string) =>
                set((state) => ({
                    blacklistedKeywords: state.blacklistedKeywords.filter(
                        (k) => k !== keyword
                    ),
                })),

            addToQueue: (video) =>
                set((state) => {
                    const videoWithQueueId = {
                        ...video,
                        queueId: `${video.id}-${Date.now()}-${Math.random()
                            .toString(36)
                            .substr(2, 9)}`,
                    };
                    // If no video is playing, automatically play the added one
                    if (!state.currentVideo && state.queue.length === 0) {
                        return {
                            currentVideo: videoWithQueueId,
                            isPlaying: true,
                        };
                    }
                    return { queue: [...state.queue, videoWithQueueId] };
                }),

            removeFromQueue: (queueId) =>
                set((state) => ({
                    queue: state.queue.filter((v) => v.queueId !== queueId),
                })),

            playNext: () =>
                set((state) => {
                    const nextVideo = state.queue[0];
                    const newHistory = state.currentVideo
                        ? [state.currentVideo, ...state.history].slice(0, 10)
                        : state.history;

                    if (!nextVideo) {
                        return {
                            currentVideo: null,
                            isPlaying: false,
                            history: newHistory,
                        };
                    }

                    return {
                        currentVideo: nextVideo,
                        queue: state.queue.slice(1),
                        history: newHistory,
                        isPlaying: true,
                    };
                }),

            playPrevious: () =>
                set((state) => {
                    if (state.history.length === 0) return state;

                    const prevVideo = state.history[0];
                    const newHistory = state.history.slice(1);
                    const newQueue = state.currentVideo
                        ? [state.currentVideo, ...state.queue]
                        : state.queue;

                    return {
                        currentVideo: prevVideo,
                        history: newHistory,
                        queue: newQueue,
                        isPlaying: true,
                    };
                }),

            clearQueue: () => set({ queue: [] }),

            reorderQueue: (oldIndex, newIndex) =>
                set((state) => {
                    const newQueue = [...state.queue];
                    const [movedItem] = newQueue.splice(oldIndex, 1);
                    newQueue.splice(newIndex, 0, movedItem);
                    return { queue: newQueue };
                }),

            setCurrentVideo: (video) => {
                set((state) => ({ 
                    history: state.currentVideo 
                        ? [state.currentVideo, ...state.history].slice(0, 10) 
                        : state.history,
                    currentVideo: video, 
                    isPlaying: !!video,
                }));
            },

            setIsPlaying: (playing) => {
                set({ isPlaying: playing });
            },

            setVolume: (volume) => set({ volume }),

            setDonationAlertsNotificationsStatus: (enabled: boolean) =>
                set({ donationAlertsNotifications: enabled }),

            setYoutubeVideoNotificationsStatus: (enabled: boolean) =>
                set({ youtubeVideoNotifications: enabled }),
        }),
        {
            name: 'streamer-player-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => {
                const { daConnectionStatus, ...rest } = state;
                return rest;
            },
        }
    )
);