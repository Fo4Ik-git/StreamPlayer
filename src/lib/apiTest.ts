
export async function checkYoutubeConnection(apiKey: string) {
    if (!apiKey) return false;
    try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=id&chart=mostPopular&maxResults=1&key=${apiKey}`);
        return res.ok;
    } catch {
        return false;
    }
}