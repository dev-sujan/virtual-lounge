import { extractYouTubeId, fetchYouTubeMeta, type YouTubeMeta } from './youtubeUtils';

export interface PresetTrack {
  id: string;
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: number;
  genre: 'lofi' | 'synthwave' | 'jazz' | 'chill' | 'pop' | 'ambient';
}

export const GENRE_CATEGORIES = [
  { id: 'all', label: 'All Hits' },
  { id: 'lofi', label: '☕ Lofi Beats' },
  { id: 'synthwave', label: '🌌 Synthwave' },
  { id: 'jazz', label: '🎷 Jazz Lounge' },
  { id: 'chill', label: '🌿 Chillhop' },
  { id: 'ambient', label: '🌊 Deep Focus' },
  { id: 'pop', label: '🔥 Chart Hits' },
];

export const PRESET_LOUNGE_TRACKS: PresetTrack[] = [
  {
    id: 'preset_lofi_1',
    videoId: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    author: 'Lofi Girl',
    thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    duration: 300,
    genre: 'lofi',
  },
  {
    id: 'preset_lofi_2',
    videoId: '5qap5aO4i9A',
    title: 'Lofi Hip Hop Radio - Beats to Sleep/Chill to',
    author: 'Lofi Girl',
    thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
    duration: 300,
    genre: 'lofi',
  },
  {
    id: 'preset_synth_1',
    videoId: '4xDzrJKXOOY',
    title: 'synthwave radio - chill / retro beats',
    author: 'Lofi Girl Synthwave',
    thumbnail: 'https://img.youtube.com/vi/4xDzrJKXOOY/hqdefault.jpg',
    duration: 300,
    genre: 'synthwave',
  },
  {
    id: 'preset_jazz_1',
    videoId: 'DXUAyRRkI6k',
    title: 'Coffee Shop Warm Jazz Music for Chill & Study',
    author: 'Relaxing Jazz',
    thumbnail: 'https://img.youtube.com/vi/DXUAyRRkI6k/hqdefault.jpg',
    duration: 240,
    genre: 'jazz',
  },
  {
    id: 'preset_chill_1',
    videoId: 'TURbeWK2wwg',
    title: 'Chillhop Radio - Jazzy & Lofi Hip Hop Beats',
    author: 'Chillhop Music',
    thumbnail: 'https://img.youtube.com/vi/TURbeWK2wwg/hqdefault.jpg',
    duration: 270,
    genre: 'chill',
  },
  {
    id: 'preset_ambient_1',
    videoId: 'lTRiuFIWV54',
    title: 'Deep Focus Music for Learning & Concentration',
    author: 'Ambient Study Beats',
    thumbnail: 'https://img.youtube.com/vi/lTRiuFIWV54/hqdefault.jpg',
    duration: 300,
    genre: 'ambient',
  },
  {
    id: 'preset_pop_1',
    videoId: 'fJ9rUzIMcZQ',
    title: 'Queen - Bohemian Rhapsody (Official Video)',
    author: 'Queen Official',
    thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    duration: 355,
    genre: 'pop',
  },
  {
    id: 'preset_pop_2',
    videoId: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    author: 'Luis Fonsi',
    thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    duration: 228,
    genre: 'pop',
  },
  {
    id: 'preset_pop_3',
    videoId: 'OPf0YbXqDm0',
    title: 'Mark Ronson - Uptown Funk ft. Bruno Mars',
    author: 'Mark Ronson',
    thumbnail: 'https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg',
    duration: 270,
    genre: 'pop',
  },
  {
    id: 'preset_synth_2',
    videoId: 'MVPTGNGiI-4',
    title: 'The Midnight - Sunset (Official Audio)',
    author: 'The Midnight',
    thumbnail: 'https://img.youtube.com/vi/MVPTGNGiI-4/hqdefault.jpg',
    duration: 326,
    genre: 'synthwave',
  },
];

export async function searchYouTubeTracks(query: string): Promise<YouTubeMeta[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Check if it's a direct URL or ID first
  const directId = extractYouTubeId(trimmed);
  if (directId) {
    const meta = await fetchYouTubeMeta(directId);
    return [meta];
  }

  // Search curated preset tracks matching query
  const lowerQuery = trimmed.toLowerCase();
  const matchedPresets = PRESET_LOUNGE_TRACKS.filter(
    (t) => t.title.toLowerCase().includes(lowerQuery) || t.author.toLowerCase().includes(lowerQuery)
  ).map((t) => ({
    videoId: t.videoId,
    title: t.title,
    author: t.author,
    thumbnail: t.thumbnail,
    duration: t.duration,
  }));

  // Attempt Piped Public API search for live YouTube results across multiple mirror instances
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.privacydev.net',
    'https://piped-api.garudalinux.org',
  ];

  for (const base of instances) {
    try {
      const pipedUrl = `${base}/search?q=${encodeURIComponent(trimmed)}&filter=music`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(pipedUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.items && Array.isArray(data.items)) {
          const liveItems: YouTubeMeta[] = data.items
            .filter((item: any) => (item.type === 'stream' || item.url) && item.url)
            .slice(0, 8)
            .map((item: any) => {
              const vId = item.url.replace('/watch?v=', '');
              return {
                videoId: vId,
                title: item.title || 'YouTube Music Track',
                author: item.uploaderName || 'YouTube Artist',
                thumbnail: item.thumbnail || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
                duration: item.duration || 180,
              };
            });

          if (liveItems.length > 0) {
            const merged = [...liveItems];
            matchedPresets.forEach((p) => {
              if (!merged.some((m) => m.videoId === p.videoId)) {
                merged.push(p);
              }
            });
            return merged;
          }
        }
      }
    } catch {
      // Continue to next mirror on failure
    }
  }

  return matchedPresets;
}
