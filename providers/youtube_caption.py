import eel
import logging
from youtube_transcript_api import YouTubeTranscriptApi

logger = logging.getLogger("YOUTUBE_CAPTION")

class YoutubeCaptionProvider:
    def __init__(self):
        self.logger = logger
        self.ytt_api = YouTubeTranscriptApi()

    def get_transcript(self, video_id, languages=['ru', 'en']):
        """
        Fetches the transcript for a given YouTube video ID.
        Tries to get the transcript in Russian first, then English.
        """
        self.logger.info(f"Fetching transcript for video: {video_id}")
        try:
            transcript_list = self.ytt_api.fetch(video_id, languages=languages)
            
            full_text = ''
            
            for snippet in transcript_list:
                full_text += snippet.text + ' '

            self.logger.info(f"Successfully fetched transcript for {video_id} ({len(full_text)} chars)")
            return {
                "success": True,
                "transcript": full_text
            }
            
        except TranscriptsDisabled:
            self.logger.warning(f"Transcripts are disabled for video: {video_id}")
            return {"success": False, "message": "Subtitles are disabled"}
        except NoTranscriptFound:
            self.logger.warning(f"No transcript found for video: {video_id} in languages {languages}")
            return {"success": False, "message": "No transcript found for requested languages"}
        except Exception as e:
            self.logger.error(f"Error fetching transcript: {e}")
            return {"success": False, "message": str(e)}

caption_provider = YoutubeCaptionProvider()

@eel.expose
def get_video_transcript(video_id):
    return caption_provider.get_transcript(video_id)