export const VIDEO_PATHS = [
  "/media/video/forest-sunlight.mp4",
  "/media/video/forest-woods.mp4",
  "/media/video/lake-view.mp4",
  "/media/video/rooftop-sunset.mp4",
  "/media/video/sea-foam-shore.mp4",
  "/media/video/waves-sea.mp4",
] as const;

export const AUDIO_PATHS = [
  "/media/audio/earth.mp3",
  "/media/audio/fireflies.mp3",
  "/media/audio/our-home.mp3",
  "/media/audio/strangers-instrumental.mp3",
  "/media/audio/where-hope-begins.mp3",
] as const;

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
