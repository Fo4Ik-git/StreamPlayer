import { toast } from 'react-toastify';
import i18n from '../i18n';
import { useStore } from '../store/useStore';
import type { Donation } from './interfaces';

export async function checkYoutubeConnection(apiKey: string) {
    if (!apiKey) return false;
    try {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=id&chart=mostPopular&maxResults=1&key=${apiKey}`
        );
        return res.ok;
    } catch {
        return false;
    }
}

export const extractYoutubeIds = (
    url: string
): { videoId: string | null; playlistId: string | null } => {
    const videoMatch = url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    const playlistMatch = url.match(/[?&]list=([^#\&\?]+)/);

    const result = {
        videoId: videoMatch ? videoMatch[1] : null,
        playlistId: playlistMatch ? playlistMatch[1] : null,
    };

    console.log("extractYoutubeIds result", result)

    return result
};

async function fetchYoutubeVideoDetails(
    videoId: string,
    youtubeApiKey: string
) {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${youtubeApiKey}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch video details');
        }

        const data = await response.json();
        if (!data.items || data.items.length === 0) {
            toast.error(i18n.t('notifications.video_not_found'));
            return null;
        }

        console.log("data", data.items[0])
        return data.items[0];
    } catch (error) {
        console.error('[App] Video processing error:', error);
        toast.error('Error processing video');
        return null;
    }
}

async function fetchPlaylistVideoIds(playlistId: string, youtubeApiKey: string): Promise<string[]> {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${youtubeApiKey}`
        );
        if (!response.ok) throw new Error('Failed to fetch playlist');
        const data = await response.json();
        return data.items?.map((item: any) => item.contentDetails.videoId) || [];
    } catch (error) {
        console.error('[YouTube API] Playlist fetch error:', error);
        toast.error('Ошибка при загрузке плейлиста');
        return [];
    }
}

async function processAndAddVideo(videoId: string, donation: Donation, apiKey: string) {
    const store = useStore.getState();
    const { minViewCount, minLikeCount, blacklistedKeywords, addToQueue } = store;

    const video = await fetchYoutubeVideoDetails(videoId, apiKey);
    console.log("Fetched video details:", video);
    if (!video) return false;

    const stats = video.statistics;
    const snippet = video.snippet;
    const viewCount = parseInt(stats.viewCount || '0', 10);
    const likeCount = parseInt(stats.likeCount || '0', 10);
    const title = snippet.title;

    // Check view count
    if (viewCount < minViewCount) {
        console.warn(`Skipped: ${title} (Views: ${viewCount} < ${minViewCount})`);
        return false;
    }

    // Check like count
    if (likeCount < minLikeCount) {
        console.warn(`Skipped: ${title} (Likes: ${likeCount} < ${minLikeCount})`);
        return false;
    }
    
    // Check blacklisted keywords
    const isBlacklisted = blacklistedKeywords.some((keyword) =>
        title.toLowerCase().includes(keyword.toLowerCase())
    );
    if (isBlacklisted) {
        console.warn(`Skipped: ${title} (Blacklisted)`);
        return false;
    }

    const videoItem = {
        id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: title,
        requester: donation.username,
        amount: donation.amount,
        duration: video.contentDetails.duration,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        addedAt: Date.now(),
    };

    addToQueue(videoItem);
    return true;
}

export async function addYoutubeVideoToQueueManual(url: string) {
    const store = useStore.getState();
    const { youtubeApiKey } = store;
    
    if (!youtubeApiKey) {
        toast.warning(i18n.t('notifications.missing_api_key'));
        return;
    }
    const { videoId, playlistId } = extractYoutubeIds(url);
    if (!videoId && !playlistId) {
        toast.error(i18n.t('notifications.invalid_url'));
        return;
    }

    let videosAdded = 0;

    // CASE 1: It's a playlist
    if (playlistId) {
        const videoIds = await fetchPlaylistVideoIds(playlistId, youtubeApiKey);
        toast.info(`Processing playlist: ${videoIds.length} videos...`);

        console.log("Playlist video IDs:", videoIds);
        
        for (const id of videoIds) {    
            const success = await processAndAddVideo(id, {
                username: 'Streamer',
                amount: 0,
                currency: '',
                id: 0,
                timestamp: Date.now()
            }, youtubeApiKey);
            if (success) videosAdded++;
        }
    } 
    // CASE 2: It's a single video
    else if (videoId) {
        const success = await processAndAddVideo(videoId, {
            username: 'Streamer',
            amount: 0,
            currency: '',
            id: 0,
            timestamp: Date.now()
        }, youtubeApiKey);
        if (success) videosAdded++;
    }

    // Final notification
    if (videosAdded > 0) {
        toast.success(`Videos added: ${videosAdded}`);
    } else {
        toast.error('No videos passed the filters or were found');
    }
}

export async function addYoutubeVideoToQueue(donation: Donation) {
    const store = useStore.getState();
    const { youtubeApiKey } = store;

    if (!youtubeApiKey) {
        toast.warning(i18n.t('notifications.missing_api_key'));
        return;
    }

    if (!donation.message) return;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = donation.message.match(urlRegex);
    if (!urls) return;

    // Get the first link in the message
    const { videoId, playlistId } = extractYoutubeIds(urls[0]);
    
    let videosAdded = 0;

    // CASE 1: It's a playlist
    if (playlistId) {
        const videoIds = await fetchPlaylistVideoIds(playlistId, youtubeApiKey);
        toast.info(`Обработка плейлиста: ${videoIds.length} видео...`);
        
        for (const id of videoIds) {
            const success = await processAndAddVideo(id, donation, youtubeApiKey);
            if (success) videosAdded++;
        }
    } 
    // CASE 2: It's a single video
    else if (videoId) {
        const success = await processAndAddVideo(videoId, donation, youtubeApiKey);
        if (success) videosAdded++;
    }

    // Final notification
    if (videosAdded > 0) {
        toast.success(`Добавлено видео: ${videosAdded}`);
    } else {
        toast.error('Ни одно видео не прошло фильтры или не найдено');
    }
}
