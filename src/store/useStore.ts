import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface VideoItem {
  queueId?: string; // Unique ID for this specific queue entry
  id: string; // YouTube Video ID
  url: string;
  title: string;
  requester: string;
  amount: number;
  duration: string; // ISO 8601 or formatted string
  thumbnail: string;
  addedAt: number;
}

interface SettingsState {
  youtubeApiKey: string;
  donationAlertsToken: string;
  donationAlertsRefreshToken: string;
  donationAlertsTokenExpiry: number;
  donationAlertsUserId: string;
  donationAlertsClientId: string;
  donationAlertsClientSecret: string;
  donationXApiKey: string;
  minDonationAmount: number;
  minViewCount: number;
  minLikeCount: number;
  blacklistedKeywords: string[];
  daConnectionStatus: 'connected' | 'disconnected' | 'connecting';
  setSettings: (settings: Partial<SettingsState>) => void;
  addBlacklistedKeyword: (keyword: string) => void;
  removeBlacklistedKeyword: (keyword: string) => void;
  setDAConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;
}

interface QueueState {
  queue: VideoItem[];
  currentVideo: VideoItem | null;
  history: VideoItem[];
  isPlaying: boolean;
  volume: number;
  addToQueue: (video: VideoItem) => void;
  removeFromQueue: (id: string) => void;
  playNext: () => void;
  playPrevious: () => void;
  clearQueue: () => void;
  reorderQueue: (oldIndex: number, newIndex: number) => void;
  setCurrentVideo: (video: VideoItem | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
}

interface AppState extends SettingsState, QueueState {}

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
      minDonationAmount: 100,
      minViewCount: 50000,
      minLikeCount: 10000,
      blacklistedKeywords: [],
      daConnectionStatus: 'disconnected',

      // Queue Initial State
      queue: [],
      currentVideo: null,
      history: [],
      isPlaying: false,
      volume: 80,

      // Actions
      setSettings: (newSettings) => {
        console.log('[Store] setSettings called with:', newSettings);
        set((state) => {
          const newState = { ...state, ...newSettings };
          console.log('[Store] New state after merge:', {
            hasToken: !!newState.donationAlertsToken,
            tokenLength: newState.donationAlertsToken?.length,
            userId: newState.donationAlertsUserId
          });
          return newState;
        });
      },
      
      setDAConnectionStatus: (status) => set({ daConnectionStatus: status }),
      
      addBlacklistedKeyword: (keyword) => 
        set((state) => ({ 
          blacklistedKeywords: [...state.blacklistedKeywords, keyword] 
        })),

      removeBlacklistedKeyword: (keyword) =>
        set((state) => ({
          blacklistedKeywords: state.blacklistedKeywords.filter((k) => k !== keyword)
        })),

      addToQueue: (video) => set((state) => {
        const videoWithQueueId = { 
          ...video, 
          queueId: `${video.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
        };
        // If no video is playing, automatically play the added one
        if (!state.currentVideo && state.queue.length === 0) {
          return { currentVideo: videoWithQueueId, isPlaying: true };
        }
        return { queue: [...state.queue, videoWithQueueId] };
      }),

      removeFromQueue: (queueId) => set((state) => ({
        queue: state.queue.filter((v) => v.queueId !== queueId)
      })),

      playNext: () => set((state) => {
        const nextVideo = state.queue[0];
        const newHistory = state.currentVideo 
          ? [state.currentVideo, ...state.history].slice(0, 50)
          : state.history;

        if (!nextVideo) {
            return { currentVideo: null, isPlaying: false, history: newHistory };
        }
        
        return {
          currentVideo: nextVideo,
          queue: state.queue.slice(1),
          history: newHistory,
          isPlaying: true
        };
      }),

      playPrevious: () => set((state) => {
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
          isPlaying: true
        };
      }),

      clearQueue: () => set({ queue: [] }),
      
      reorderQueue: (oldIndex, newIndex) => set((state) => {
        const newQueue = [...state.queue];
        const [movedItem] = newQueue.splice(oldIndex, 1);
        newQueue.splice(newIndex, 0, movedItem);
        return { queue: newQueue };
      }),

      setCurrentVideo: (video) => {
        set({ currentVideo: video, isPlaying: !!video });
      },
      
      setIsPlaying: (playing) => {
        set({ isPlaying: playing });
      },
      
      setVolume: (volume) => set({ volume }),
    }),
    {
      name: 'streamer-player-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Не сохраняем временный статус подключения
        const { daConnectionStatus, ...rest } = state;
        return rest;
      },
    }
  )
);
