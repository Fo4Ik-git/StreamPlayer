import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface VideoItem {
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
  setSettings: (settings: Partial<SettingsState>) => void;
  addBlacklistedKeyword: (keyword: string) => void;
  removeBlacklistedKeyword: (keyword: string) => void;
}

interface QueueState {
  queue: VideoItem[];
  currentVideo: VideoItem | null;
  history: VideoItem[];
  addToQueue: (video: VideoItem) => void;
  removeFromQueue: (id: string) => void;
  playNext: () => void;
  clearQueue: () => void;
  setCurrentVideo: (video: VideoItem | null) => void;
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

      // Queue Initial State
      queue: [],
      currentVideo: null,
      history: [],

      // Actions
      setSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
      
      addBlacklistedKeyword: (keyword) => 
        set((state) => ({ 
          blacklistedKeywords: [...state.blacklistedKeywords, keyword] 
        })),

      removeBlacklistedKeyword: (keyword) =>
        set((state) => ({
          blacklistedKeywords: state.blacklistedKeywords.filter((k) => k !== keyword)
        })),

      addToQueue: (video) => set((state) => ({ queue: [...state.queue, video] })),

      removeFromQueue: (id) => set((state) => ({
        queue: state.queue.filter((v) => v.id !== id)
      })),

      playNext: () => set((state) => {
        const nextVideo = state.queue[0];
        if (!nextVideo) return { currentVideo: null };
        return {
          currentVideo: nextVideo,
          queue: state.queue.slice(1),
          history: [state.currentVideo, ...state.history].filter((v): v is VideoItem => v !== null).slice(0, 50), // Keep last 50
        };
      }),

      clearQueue: () => set({ queue: [] }),

      setCurrentVideo: (video) => set({ currentVideo: video }),
    }),
    {
      name: 'streamer-player-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
