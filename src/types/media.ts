export type MediaLoadStatus = "loading" | "ready" | "error";

export interface UseBackgroundMediaReturn {
  videoStatus: MediaLoadStatus;
  audioStatus: MediaLoadStatus;
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  videoSrc: string;
  audioSrc: string;
  nextVideo: () => void;
  nextAudio: () => void;
  previousAudio: () => void;
}
