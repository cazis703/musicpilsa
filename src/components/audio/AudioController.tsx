"use client";

import NowPlaying from "@/components/audio/NowPlaying";
import PlayPauseButton from "@/components/audio/PlayPauseButton";
import SfxTypeDropdown from "@/components/audio/SfxTypeDropdown";
import VolumeSlider from "@/components/audio/VolumeSlider";
import {
  NoteIcon,
  NoteMutedIcon,
  SettingsIcon,
  SkipNextIcon,
  SkipPreviousIcon,
  SpeakerMutedIcon,
  SpeakerOnIcon,
  SwitchIcon,
} from "@/components/ui/icons";
import { getAudioTrackMeta } from "@/lib/media-paths";
import { KEY_SWITCH_OPTIONS, type KeySwitchType } from "@/data/keySwitches";
import type { MediaLoadStatus } from "@/types/media";

interface AudioControllerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioStatus: MediaLoadStatus;
  audioSrc: string;
  onNextVideo: () => void;
  onNextAudio: () => void;
  onPreviousAudio: () => void;
  isMuted: boolean;
  volume: number;
  isPlaying: boolean;
  toggleMute: () => void;
  setVolume: (value: number) => void;
  togglePlay: () => void;
  sfxVolume: number;
  onSfxVolumeChange: (value: number) => void;
  isSfxMuted: boolean;
  onToggleSfxMute: () => void;
  keySwitchType: KeySwitchType;
  onKeySwitchTypeChange: (type: KeySwitchType) => void;
  onOpenSettings: () => void;
}

export default function AudioController({
  audioRef,
  audioStatus,
  audioSrc,
  onNextVideo,
  onNextAudio,
  onPreviousAudio,
  isMuted,
  volume,
  isPlaying,
  toggleMute,
  setVolume,
  togglePlay,
  sfxVolume,
  onSfxVolumeChange,
  isSfxMuted,
  onToggleSfxMute,
  keySwitchType,
  onKeySwitchTypeChange,
  onOpenSettings,
}: AudioControllerProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/40 px-5 py-2 backdrop-blur">
      <audio ref={audioRef} src={audioSrc} />

      {/* a. 배경 바꾸기 */}
      <button
        type="button"
        onClick={onNextVideo}
        aria-label="배경 바꾸기"
        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-white/70 transition-colors hover:text-white"
      >
        배경 바꾸기
        <SwitchIcon className="h-3.5 w-3.5" />
      </button>

      <span className="h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />

      {/* b. 음악 재생 정보 */}
      {audioStatus !== "error" && (
        <div className="shrink-0">
          <NowPlaying track={getAudioTrackMeta(audioSrc)} />
        </div>
      )}

      {audioStatus !== "error" && (
        <>
          <span className="h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />

          {/* c. 이전 곡 / 재생·일시정지 / 다음 곡 — 유튜브 플레이어 스타일 */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onPreviousAudio}
              aria-label="이전 곡"
              className="text-white/70 transition-colors hover:text-white"
            >
              <SkipPreviousIcon className="h-4 w-4" />
            </button>
            <PlayPauseButton isPlaying={isPlaying} onToggle={togglePlay} />
            <button
              type="button"
              onClick={onNextAudio}
              aria-label="다음 곡"
              className="text-white/70 transition-colors hover:text-white"
            >
              <SkipNextIcon className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      <span className="h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />

      {/* d. 스피커 아이콘 + 음량 조절 슬라이더 */}
      {audioStatus === "error" ? (
        <span className="shrink-0 text-xs text-white/30" aria-hidden="true">
          audio unavailable
        </span>
      ) : (
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "음소거 해제" : "음소거"}
            aria-pressed={isMuted}
            className="text-white/70 transition-colors hover:text-white"
          >
            {isMuted ? <SpeakerMutedIcon className="h-5 w-5" /> : <SpeakerOnIcon className="h-5 w-5" />}
          </button>
          {/* 음소거 중엔 슬라이더를 맨 왼쪽(0)으로 보여준다. 실제 volume 값 자체는 건드리지
              않으므로, 음소거를 해제하면 마지막 볼륨 위치로 자동 복원된다. */}
          <VolumeSlider value={isMuted ? 0 : volume} onChange={setVolume} ariaLabel="배경 음악 볼륨" />
        </div>
      )}

      <span className="h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />

      {/* e. 효과음 음소거 버튼 + 볼륨 조절 슬라이더 */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSfxMute}
          aria-label={isSfxMuted ? "효과음 음소거 해제" : "효과음 음소거"}
          aria-pressed={isSfxMuted}
          className="text-white/70 transition-colors hover:text-white"
        >
          {isSfxMuted ? <NoteMutedIcon className="h-5 w-5" /> : <NoteIcon className="h-5 w-5" />}
        </button>
        <VolumeSlider value={isSfxMuted ? 0 : sfxVolume} onChange={onSfxVolumeChange} ariaLabel="효과음 볼륨" />
      </div>

      <span className="h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />

      {/* f. 타건음 스위치 타입 선택 */}
      <SfxTypeDropdown
        options={KEY_SWITCH_OPTIONS}
        value={keySwitchType}
        onChange={onKeySwitchTypeChange}
        ariaLabel="타건음 스위치 종류"
        tooltip="타이핑음"
      />

      <span className="h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />

      {/* g. 설정 열기 — 문장 Set/타이틀/배경/폰트·톤/배경음 등 전체 설정은 이 안에 모여있다 */}
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="설정 열기"
        className="text-white/70 transition-colors hover:text-white"
      >
        <SettingsIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
