export interface YouTubeMeta {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: number;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  
  // Standard Watch URL or Music URL
  const matchWatch = trimmed.match(/(?:youtube\.com|music\.youtube\.com)\/(?:watch\?v=|embed\/|v\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  if (matchWatch && matchWatch[1]) return matchWatch[1];

  // Short URL (youtu.be/xxxxx)
  const matchShort = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (matchShort && matchShort[1]) return matchShort[1];

  // Raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export async function fetchYouTubeMeta(videoId: string): Promise<YouTubeMeta> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`;

  const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  
  try {
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          videoId,
          title: data.title || `YouTube Track (${videoId})`,
          author: data.author_name || 'YouTube Creator',
          thumbnail: data.thumbnail_url || fallbackThumbnail,
          duration: 180, // Default estimated duration, updated when loaded in player
        };
      }
    }
  } catch (err) {
    console.warn('oEmbed fetch error, using fallback info:', err);
  }

  return {
    videoId,
    title: `YouTube Track (${videoId})`,
    author: 'YouTube',
    thumbnail: fallbackThumbnail,
    duration: 180,
  };
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
