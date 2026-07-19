"use client";

import { useAudioControls } from "@/hooks/useAudioControls";
import { SpeakerMutedIcon, SpeakerOnIcon, SwitchIcon } from "@/components/ui/icons";
import type { MediaLoadStatus } from "@/types/media";

interface AudioControllerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioStatus: MediaLoadStatus;
  audioSrc: string;
  onNextVideo: () => void;
  onNextAudio: () => void;
}

export default function AudioController({
  audioRef,
  audioStatus,
  audioSrc,
  onNextVideo,
  onNextAudio,
}: AudioControllerProps) {
  const { isMuted, volume, toggleMute, setVolume } = useAudioControls(audioRef);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-black/40 px-4 py-2 backdrop-blur">
      <audio ref={audioRef} src={audioSrc} />

      <button
        type="button"
        onClick={onNextVideo}
        aria-label="배경 바꾸기"
        className="flex items-center gap-1.5 whitespace-nowrap text-xs text-white/70 transition-colors hover:text-white"
      >
        배경 바꾸기
        <SwitchIcon className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={onNextAudio}
        aria-label="음악 바꾸기"
        className="flex items-center gap-1.5 whitespace-nowrap text-xs text-white/70 transition-colors hover:text-white"
      >
        음악 바꾸기
        <SwitchIcon className="h-3.5 w-3.5" />
      </button>

      {audioStatus === "error" ? (
        <span className="text-xs text-white/30" aria-hidden="true">
          audio unavailable
        </span>
      ) : (
        <>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "음소거 해제" : "음소거"}
            aria-pressed={isMuted}
            className="text-white/70 transition-colors hover:text-white"
          >
            {isMuted ? <SpeakerMutedIcon className="h-5 w-5" /> : <SpeakerOnIcon className="h-5 w-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label="배경 음악 볼륨"
            className="w-24 accent-white/80"
          />
        </>
      )}
    </div>
  );
}
