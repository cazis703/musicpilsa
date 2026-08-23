export const VIDEO_PATHS = [
  "/media/video/forest-sunlight.mp4",
  "/media/video/forest-woods.mp4",
  "/media/video/lake-view.mp4",
  "/media/video/rooftop-sunset.mp4",
  "/media/video/sea-foam-shore.mp4",
  "/media/video/waves-sea.mp4",
  "/media/video/cityscape-sunset-golden-hour.mp4",
  "/media/video/forest-green-rain-tranquil.mp4",
  "/media/video/ocean-sun-summer-evening.mp4",
  "/media/video/tree-green-field-aerial.mp4",
  "/media/video/tree-trunk-forest-canopy.mp4",
] as const;

export const AUDIO_PATHS = [
  "/media/audio/earth.mp3",
  "/media/audio/fireflies.mp3",
  "/media/audio/our-home.mp3",
  "/media/audio/strangers-instrumental.mp3",
  "/media/audio/where-hope-begins.mp3",
  "/media/audio/i-dreamed-you-up.mp3",
  "/media/audio/little-after-all.mp3",
  "/media/audio/departure.mp3",
] as const;

export interface AudioTrackMeta {
  title: string;
  artist: string;
  license: string;
}

// 파일명 기반 추정치. 정확한 아티스트/라이선스 표기가 확인되면 이 값을 갱신할 것.
export const AUDIO_TRACK_META: Record<(typeof AUDIO_PATHS)[number], AudioTrackMeta> = {
  "/media/audio/earth.mp3": { title: "Earth", artist: "Daniel Magen", license: "License unconfirmed" },
  "/media/audio/fireflies.mp3": { title: "Fireflies", artist: "Unknown Artist", license: "License unconfirmed" },
  "/media/audio/our-home.mp3": { title: "Our Home", artist: "Unknown Artist", license: "License unconfirmed" },
  "/media/audio/strangers-instrumental.mp3": {
    title: "Strangers (Instrumental)",
    artist: "Alex Hager",
    license: "License unconfirmed",
  },
  "/media/audio/where-hope-begins.mp3": {
    title: "Where Hope Begins",
    artist: "Lumine Wave",
    license: "License unconfirmed",
  },
  "/media/audio/i-dreamed-you-up.mp3": {
    title: "I Dreamed You Up (Instrumental)",
    artist: "Bixxby",
    license: "License unconfirmed",
  },
  "/media/audio/little-after-all.mp3": {
    title: "Little After All (Instrumental)",
    artist: "Bradbury Lane",
    license: "License unconfirmed",
  },
  "/media/audio/departure.mp3": {
    title: "Departure",
    artist: "Steven Beddall",
    license: "License unconfirmed",
  },
};

export function getAudioTrackMeta(path: string): AudioTrackMeta {
  return (
    AUDIO_TRACK_META[path as (typeof AUDIO_PATHS)[number]] ?? {
      title: "Unknown Track",
      artist: "Unknown Artist",
      license: "License unconfirmed",
    }
  );
}

export const VIDEO_READY_TIMEOUT_MS = 3000;

export function pickRandomPath(paths: readonly string[], excludePath: string | null): string {
  const candidates = paths.length > 1 ? paths.filter((path) => path !== excludePath) : paths;
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

export function pickNextPath(paths: readonly string[], currentPath: string): string {
  const currentIndex = paths.indexOf(currentPath);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % paths.length;
  return paths[nextIndex];
}

export function pickPreviousPath(paths: readonly string[], currentPath: string): string {
  const currentIndex = paths.indexOf(currentPath);
  const previousIndex = currentIndex === -1 ? 0 : (currentIndex - 1 + paths.length) % paths.length;
  return paths[previousIndex];
}
