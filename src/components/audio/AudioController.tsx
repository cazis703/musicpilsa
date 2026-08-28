"use client";

import AmbientSoundControl from "@/components/audio/AmbientSoundControl";
import MusicPlaylistDropdown from "@/components/audio/MusicPlaylistDropdown";
import PlayPauseButton from "@/components/audio/PlayPauseButton";
import SfxTypeDropdown from "@/components/audio/SfxTypeDropdown";
import VolumeSlider from "@/components/audio/VolumeSlider";
import {
  SettingsIcon,
  SkipNextIcon,
  SkipPreviousIcon,
  SpeakerMutedIcon,
  SpeakerOnIcon,
  SwitchIcon,
} from "@/components/ui/icons";
import { KEY_SWITCH_OPTIONS, type KeySwitchType } from "@/data/keySwitches";
import type { AmbientSoundId, AmbientSoundPositions } from "@/types/ambientSound";
import type { MediaLoadStatus } from "@/types/media";

interface AudioControllerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioStatus: MediaLoadStatus;
  audioSrc: string;
  onNextVideo: () => void;
  onNextAudio: () => void;
  onPreviousAudio: () => void;
  onSelectAudio: (path: string) => void;
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
  ambientPositions: AmbientSoundPositions;
  onToggleAmbientSound: (id: AmbientSoundId) => void;
  onAmbientVolumeChange: (id: AmbientSoundId, volume: number) => void;
  onOpenSettings: () => void;
  isRevealed: boolean;
  revealDelayMs?: number;
}

export default function AudioController({
  audioRef,
  audioStatus,
  audioSrc,
  onNextVideo,
  onNextAudio,
  onPreviousAudio,
  onSelectAudio,
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
  ambientPositions,
  onToggleAmbientSound,
  onAmbientVolumeChange,
  onOpenSettings,
  isRevealed,
  revealDelayMs,
}: AudioControllerProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/30 px-5 py-2 ${
        isRevealed ? "animate-fade-up-in-x" : "opacity-0"
      }`}
      style={isRevealed && revealDelayMs ? { animationDelay: `${revealDelayMs}ms` } : undefined}
    >
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

      {/* b~d. 배경음악 플레이어 한 덩어리 — 재생목록(누르면 전체 곡 목록 펼침) / 이전·재생·
          다음 / 음량을 옅은 배경(bg-white/5)으로 한 번 더 감싸서 "하나의 플레이어"로 보이게
          묶는다. 각 아이템 자체의 기존 모양(아이콘 크기, 슬라이더 스타일 등)은 그대로 둔다. */}
      {audioStatus === "error" ? (
        <span className="shrink-0 text-xs text-white/30" aria-hidden="true">
          audio unavailable
        </span>
      ) : (
        <div className="flex min-w-0 shrink-0 items-center gap-3 rounded-full bg-white/5 py-1 pl-3 pr-4">
          <MusicPlaylistDropdown audioSrc={audioSrc} isPlaying={isPlaying} onSelect={onSelectAudio} />

          <span className="h-4 w-px shrink-0 bg-white/15" aria-hidden="true" />

          {/* 이전 곡 / 재생·일시정지 / 다음 곡 — 유튜브 플레이어 스타일 */}
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

          <span className="h-4 w-px shrink-0 bg-white/15" aria-hidden="true" />

          {/* 스피커 아이콘 + 음량 조절 슬라이더 */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "음소거 해제" : "음소거"}
            aria-pressed={isMuted}
            className="shrink-0 text-white/70 transition-colors hover:text-white"
          >
            {isMuted ? <SpeakerMutedIcon className="h-5 w-5" /> : <SpeakerOnIcon className="h-5 w-5" />}
          </button>
          {/* 음소거 중엔 슬라이더를 맨 왼쪽(0)으로 보여준다. 실제 volume 값 자체는 건드리지
              않으므로, 음소거를 해제하면 마지막 볼륨 위치로 자동 복원된다. */}
          <VolumeSlider value={isMuted ? 0 : volume} onChange={setVolume} ariaLabel="배경 음악 볼륨" />
        </div>
      )}

      <span className="h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />

      {/* e. 배경음(ambient) 설정 — 켜진 게 없으면 "배경음" 텍스트, 있으면 아이콘이 겹쳐
          쌓인 형태로 몇 개 켜져 있는지 보여준다. 펼치면 켜고 끄기 + 개별 볼륨을 조절한다. */}
      <AmbientSoundControl
        positions={ambientPositions}
        onToggle={onToggleAmbientSound}
        onVolumeChange={onAmbientVolumeChange}
      />

      <span className="h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />

      {/* f. 타건음 스위치 타입 선택 — 예전엔 이 옆에 음표 아이콘 + 볼륨 슬라이더가 따로
          있었는데, 그게 "타이핑음" 볼륨인지 알아보기 어렵다는 피드백이 있어 이 드롭다운을
          펼쳤을 때 안에서 같이 조절하도록 옮겼다. */}
      <SfxTypeDropdown
        options={KEY_SWITCH_OPTIONS}
        value={keySwitchType}
        onChange={onKeySwitchTypeChange}
        ariaLabel="타건음 스위치 종류"
        tooltip="타이핑음"
        volume={sfxVolume}
        onVolumeChange={onSfxVolumeChange}
        isMuted={isSfxMuted}
        onToggleMute={onToggleSfxMute}
        volumeAriaLabel="효과음 볼륨"
      />

      <span className="h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />

      {/* g. 설정 열기 — 문장 Set/타이틀/배경/폰트·톤/배경음 등 전체 설정은 이 안에 모여있다 */}
      <div className="group relative shrink-0">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="설정 열기"
          className="text-white/70 transition-colors hover:text-white"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 origin-bottom -translate-x-1/2 scale-75 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[10px] text-white/80 opacity-0 transition-all duration-150 ease-out group-hover:scale-100 group-hover:opacity-100"
        >
          Settings
        </span>
      </div>
    </div>
  );
}
