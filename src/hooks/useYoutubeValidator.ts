import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, type VideoItem } from '../store/useStore';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  videoDetails?: Omit<VideoItem, 'requester' | 'amount' | 'addedAt'>;
}

export const useYoutubeValidator = () => {
  const { t } = useTranslation();
  const { youtubeApiKey, minViewCount, minLikeCount, blacklistedKeywords } = useStore();
  const [isValidating, setIsValidating] = useState(false);

  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const validateVideo = async (url: string): Promise<ValidationResult> => {
    setIsValidating(true);
    try {
      if (!youtubeApiKey) {
        return { isValid: false, error: t('notifications.missing_api_key') };
      }

      const videoId = extractVideoId(url);
      if (!videoId) {
        return { isValid: false, error: t('notifications.invalid_url') };
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${youtubeApiKey}`
      );

      if (!response.ok) {
        return { isValid: false, error: t('notifications.fetch_error') };
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        return { isValid: false, error: t('notifications.video_not_found') };
      }

      const video = data.items[0];
      const stats = video.statistics;
      const snippet = video.snippet;
      // const contentDetails = video.contentDetails;

      const viewCount = parseInt(stats.viewCount || '0', 10);
      const likeCount = parseInt(stats.likeCount || '0', 10);
      const title = snippet.title;

      // Check Constraints
      if (viewCount < minViewCount) {
        return { 
          isValid: false, 
          error: t('notifications.video_rejected_views', { current: viewCount.toLocaleString(), min: minViewCount.toLocaleString() })
        };
      }

      if (likeCount < minLikeCount) {
        return { 
          isValid: false, 
          error: t('notifications.video_rejected_likes', { current: likeCount.toLocaleString(), min: minLikeCount.toLocaleString() })
        };
      }

      const isBlacklisted = blacklistedKeywords.some(keyword => 
        title.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isBlacklisted) {
        return { isValid: false, error: t('notifications.video_rejected_blacklist') };
      }

      return {
        isValid: true,
        videoDetails: {
          id: videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: title,
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
          duration: video.contentDetails.duration, // Needs parsing for display preferably, but storing raw is fine
        }
      };

    } catch (error) {
        console.error("Validation Error", error);
        return { isValid: false, error: t('notifications.unexpected_error') };
    } finally {
      setIsValidating(false);
    }
  };

  return { validateVideo, isValidating };
};
