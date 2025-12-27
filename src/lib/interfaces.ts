export interface Donation {
    username: string;
    amount: number;
    currency: string;
    message?: string;
    id: number;
    timestamp: number;
    is_test?: boolean;
}

export interface VideoItem {
    queueId?: string;
    id: string;
    url: string;
    title: string;
    requester: string;
    amount: number;
    duration: string;
    thumbnail: string;
    addedAt: number;
    caption?: string;
}

export interface YoutubeVideoFilter {
    minDonationAmount: number;
    minViewCount: number;
    minLikeCount: number;
    blacklistedKeywords: string[];
    blacklistedUrls: string[];
}

export interface NotificationsState {
    donationAlertsNotifications: boolean;
    youtubeVideoNotifications: boolean;
}

export interface DonateXState {
    isDXEnabled: boolean;
    donatexToken: string;
    dxConnectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export interface DonationAlertsState {
    isDAEnabled: boolean;
    donationAlertsToken: string;
    donationAlertsRefreshToken: string;
    donationAlertsTokenExpiry: number;
    donationAlertsUserId: string;
    donationAlertsClientId: string;
    donationAlertsClientSecret: string;
    daConnectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export interface SettingsState extends DonationAlertsState, DonateXState, YoutubeVideoFilter, NotificationsState {
    youtubeApiKey: string;
    theme: 'dark' | 'light';
    isCaptionsEnabled: boolean;
    setSettings: (settings: Partial<SettingsState>) => void;
    addBlacklistedKeyword: (keyword: string) => void;
    setDonationAlertsNotificationsStatus: (enabled: boolean) => void;
    setYoutubeVideoNotificationsStatus: (enabled: boolean) => void;
    removeBlacklistedKeyword: (keyword: string) => void;
    setDAConnectionStatus: (
        status: 'connected' | 'disconnected' | 'connecting'
    ) => void;
    setDXConnectionStatus: (
        status: 'connected' | 'disconnected' | 'connecting'
    ) => void;
    setTheme: (theme: 'dark' | 'light') => void;
}

export interface QueueState {
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

export interface AppState extends SettingsState, QueueState {}

