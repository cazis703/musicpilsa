"use client";

import { useAudioControls } from "@/hooks/useAudioControls";
import NowPlaying from "@/components/audio/NowPlaying";
import { SpeakerMutedIcon, SpeakerOnIcon, SwitchIcon } from "@/components/ui/icons";
import { getAudioTrackMeta } from "@/lib/media-paths";
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
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/40 px-5 py-2 backdrop-blur">
      <audio ref={audioRef} src={audioSrc} />

      {/* a. 배경 바꾸기 */}
      <button
        type="button"
        onClick={onNextVideo}
        aria-label="배경 바꾸기"
        className="flex items-center gap-1.5 whitespace-nowrap text-xs text-white/70 transition-colors hover:text-white"
      >
        배경 바꾸기
        <SwitchIcon className="h-3.5 w-3.5" />
      </button>

      <span className="h-5 w-px bg-white/20" aria-hidden="true" />

      {/* b. 음악 재생 정보 + 음악 바꾸기 */}
      <div className="flex items-center gap-3">
        {audioStatus !== "error" && <NowPlaying track={getAudioTrackMeta(audioSrc)} />}
        <button
          type="button"
          onClick={onNextAudio}
          aria-label="음악 바꾸기"
          className="flex items-center gap-1.5 whitespace-nowrap text-xs text-white/70 transition-colors hover:text-white"
        >
          음악 바꾸기
          <SwitchIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <span className="h-5 w-px bg-white/20" aria-hidden="true" />

      {/* c. 스피커 아이콘 + 음량 조절 슬라이더 */}
      {audioStatus === "error" ? (
        <span className="text-xs text-white/30" aria-hidden="true">
          audio unavailable
        </span>
      ) : (
        <div className="flex items-center gap-3">
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
        </div>
      )}
    </div>
  );
}
