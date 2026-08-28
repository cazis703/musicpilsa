"use client";

import { useEffect } from "react";
import { getSetIcon } from "@/components/typing/ThemeSwitcher";
import AmbientSoundPicker from "@/components/audio/AmbientSoundPicker";
import VolumeSlider from "@/components/audio/VolumeSlider";
import SfxTypeDropdown from "@/components/audio/SfxTypeDropdown";
import {
  CloseIcon,
  EyeIcon,
  EyeOffIcon,
  MinusIcon,
  PlusIcon,
  RefreshIcon,
  SpeakerMutedIcon,
  SpeakerOnIcon,
  SwitchIcon,
} from "@/components/ui/icons";
import { KEY_SWITCH_OPTIONS, type KeySwitchType } from "@/data/keySwitches";
import { MAX_RECIPIENT_NAME_LENGTH } from "@/hooks/useSiteTitle";
import {
  MAX_FONT_SIZE_REM,
  MAX_FONT_WEIGHT,
  MIN_FONT_SIZE_REM,
  MIN_FONT_WEIGHT,
  type FontFamilyId,
} from "@/hooks/useFontSettings";
import type { SentenceSetId, SentenceSetMeta, SentenceTone } from "@/types/sentence";
import type { AmbientSoundId, AmbientSoundPositions } from "@/types/ambientSound";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onResetAll: () => void;

  sets: SentenceSetMeta[];
  activeSetId: SentenceSetId;
  onSelectSet: (id: SentenceSetId) => void;
  tone: SentenceTone;
  onSelectTone: (tone: SentenceTone) => void;

  recipientName: string;
  onRecipientNameChange: (name: string) => void;
  isTitleVisible: boolean;
  onHideTitle: () => void;
  onShowTitle: () => void;

  onNextVideo: () => void;

  musicVolume: number;
  isMusicMuted: boolean;
  onMusicVolumeChange: (value: number) => void;
  onToggleMusicMute: () => void;

  sfxVolume: number;
  isSfxMuted: boolean;
  onSfxVolumeChange: (value: number) => void;
  onToggleSfxMute: () => void;
  keySwitchType: KeySwitchType;
  onKeySwitchTypeChange: (type: KeySwitchType) => void;

  fontSizeRem: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onResetFontSize: () => void;
  fontWeight: number;
  onIncreaseFontWeight: () => void;
  onDecreaseFontWeight: () => void;
  onResetFontWeight: () => void;
  fontFamily: FontFamilyId;
  onSelectFontFamily: (id: FontFamilyId) => void;

  ambientPositions: AmbientSoundPositions;
  onToggleAmbientSound: (id: AmbientSoundId) => void;
  onAmbientVolumeChange: (id: AmbientSoundId, volume: number) => void;
}

// "위로" Set은 청자가 "당신"이라 하다체로 바꾸면 반말처럼 들려 어색하므로, 하다체/습니다체
// 버전 자체가 데이터에 없다(resolveSentenceText가 해요체로 fallback). 그 Set을 보는 중엔
// 톤을 바꿀 수 없으므로 톤 선택 UI 자체를 아예 숨긴다.
const TONE_UNAVAILABLE_SET_ID: SentenceSetId = "healing";

const SENTENCE_TONE_OPTIONS: { id: SentenceTone; label: string }[] = [
  { id: "haeyo", label: "부드럽게" },
  { id: "formal", label: "건조하게" },
  { id: "polite", label: "공손하게" },
];

const FONT_FAMILY_OPTIONS: { id: FontFamilyId; label: string }[] = [
  { id: "serif", label: "Serif (명조)" },
  { id: "sans", label: "Sans-Serif (고딕)" },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-[10.5px] uppercase tracking-wide text-white/40">{children}</h3>;
}

export default function SettingsDrawer({
  isOpen,
  onClose,
  onResetAll,
  sets,
  activeSetId,
  onSelectSet,
  tone,
  onSelectTone,
  recipientName,
  onRecipientNameChange,
  isTitleVisible,
  onHideTitle,
  onShowTitle,
  onNextVideo,
  musicVolume,
  isMusicMuted,
  onMusicVolumeChange,
  onToggleMusicMute,
  sfxVolume,
  isSfxMuted,
  onSfxVolumeChange,
  onToggleSfxMute,
  keySwitchType,
  onKeySwitchTypeChange,
  fontSizeRem,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize,
  fontWeight,
  onIncreaseFontWeight,
  onDecreaseFontWeight,
  onResetFontWeight,
  fontFamily,
  onSelectFontFamily,
  ambientPositions,
  onToggleAmbientSound,
  onAmbientVolumeChange,
}: SettingsDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const fontSizePx = Math.round(fontSizeRem * 16);
  const isMinSize = fontSizeRem <= MIN_FONT_SIZE_REM;
  const isMaxSize = fontSizeRem >= MAX_FONT_SIZE_REM;
  const isMinWeight = fontWeight <= MIN_FONT_WEIGHT;
  const isMaxWeight = fontWeight >= MAX_FONT_WEIGHT;
  const isToneUnavailable = activeSetId === TONE_UNAVAILABLE_SET_ID;

  return (
    <>
      {/* 배경을 어둡게 가리지 않는, 바깥 클릭 감지용 투명 히트영역 */}
      {isOpen && (
        <div className="fixed inset-0 z-40" aria-hidden="true" onClick={onClose} />
      )}

      <aside
        aria-label="설정"
        className={`fixed inset-y-0 right-0 z-50 flex w-[340px] max-w-[88vw] flex-col border-l border-white/10 bg-gradient-to-br from-neutral-900 to-black shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <h2 className="text-sm font-semibold text-white">Settings</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onResetAll}
              aria-label="설정 전체 초기화"
              className="flex items-center gap-1 text-[11px] text-white/40 transition-colors hover:text-white"
            >
              <RefreshIcon className="h-3 w-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="설정 닫기"
              className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="settings-scroll flex-1 overflow-y-auto px-5 pt-4 pb-10">
          <div className="flex flex-col divide-y divide-white/[0.06]">
            {/* 1. 문장 Set + 문장 톤 */}
            <section className="pb-5">
              <SectionHeading>문장 Set</SectionHeading>
              <div className="grid grid-cols-2 gap-2">
                {sets.map((set) => {
                  const SetIcon = getSetIcon(set.id);
                  const isActive = set.id === activeSetId;
                  return (
                    <button
                      key={set.id}
                      type="button"
                      onClick={() => onSelectSet(set.id)}
                      aria-pressed={isActive}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-colors ${
                        isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <SetIcon className="h-3.5 w-3.5" />
                      {set.label}
                    </button>
                  );
                })}
              </div>

              {/* "위로" Set을 보는 중엔 문장 톤 자체를 바꿀 수 없으므로 UI를 통째로 숨긴다 */}
              {!isToneUnavailable && (
                <>
                  <div className="mt-3 text-xs text-white/50">문장 톤</div>
                  <div className="mt-2 flex gap-1.5">
                    {SENTENCE_TONE_OPTIONS.map((option) => {
                      const isActive = option.id === tone;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => onSelectTone(option.id)}
                          aria-pressed={isActive}
                          className={`flex-1 rounded-full px-2 py-1.5 text-xs transition-colors ${
                            isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            {/* 2. 사이트 타이틀 */}
            <section className="py-5">
              <SectionHeading>사이트 타이틀</SectionHeading>
              <div className="mb-2 text-xs text-white/50">받는 사람 이름</div>
              <input
                type="text"
                value={recipientName}
                onChange={(event) => onRecipientNameChange(event.target.value.slice(0, MAX_RECIPIENT_NAME_LENGTH))}
                placeholder="이름 (선택)"
                className="w-full rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-white/50">제목 표시</span>
                <button
                  type="button"
                  onClick={() => (isTitleVisible ? onHideTitle() : onShowTitle())}
                  aria-pressed={isTitleVisible}
                  aria-label={isTitleVisible ? "제목 숨기기" : "제목 표시"}
                  className="flex items-center gap-1.5 text-xs text-white/60 transition-colors hover:text-white"
                >
                  {isTitleVisible ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
                  {isTitleVisible ? "표시 중" : "숨김"}
                </button>
              </div>
            </section>

            {/* 3. 배경 + 음악 볼륨 + 타이핑음 — 한 그룹으로 묶음 */}
            <div className="flex flex-col gap-5 py-5">
              <section>
                <SectionHeading>배경</SectionHeading>
                <button
                  type="button"
                  onClick={onNextVideo}
                  className="flex items-center gap-1.5 text-xs text-white/70 transition-colors hover:text-white"
                >
                  <SwitchIcon className="h-3.5 w-3.5" />
                  배경 바꾸기
                </button>
              </section>

              <section>
                <SectionHeading>음악 볼륨</SectionHeading>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onToggleMusicMute}
                    aria-label={isMusicMuted ? "배경음악 음소거 해제" : "배경음악 음소거"}
                    aria-pressed={isMusicMuted}
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {isMusicMuted ? <SpeakerMutedIcon className="h-5 w-5" /> : <SpeakerOnIcon className="h-5 w-5" />}
                  </button>
                  <VolumeSlider
                    value={isMusicMuted ? 0 : musicVolume}
                    onChange={onMusicVolumeChange}
                    ariaLabel="배경음악 볼륨"
                    className="flex-1"
                  />
                </div>
              </section>

              {/* 하단 바에서는 타이핑음 드롭다운을 펼치면 볼륨이 먼저 나오므로, 여기서도
                  같은 순서(볼륨 → 스위치 종류)로 두고 라벨을 분리한다. */}
              <section>
                <SectionHeading>타이핑 볼륨</SectionHeading>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onToggleSfxMute}
                    aria-label={isSfxMuted ? "효과음 음소거 해제" : "효과음 음소거"}
                    aria-pressed={isSfxMuted}
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {isSfxMuted ? <SpeakerMutedIcon className="h-5 w-5" /> : <SpeakerOnIcon className="h-5 w-5" />}
                  </button>
                  <VolumeSlider
                    value={isSfxMuted ? 0 : sfxVolume}
                    onChange={onSfxVolumeChange}
                    ariaLabel="효과음 볼륨"
                    className="flex-1"
                  />
                </div>
              </section>

              <section>
                <SectionHeading>타이핑음 선택</SectionHeading>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">스위치 종류</span>
                  <SfxTypeDropdown
                    options={KEY_SWITCH_OPTIONS}
                    value={keySwitchType}
                    onChange={onKeySwitchTypeChange}
                    ariaLabel="타건음 스위치 종류"
                    tooltip="타이핑음"
                  />
                </div>
              </section>
            </div>

            {/* 4. 폰트 (크기/굵기/글꼴 — 문장 톤은 위 1번으로 이동) */}
            <section className="py-5">
              <SectionHeading>폰트</SectionHeading>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                    <span>크기</span>
                    <button
                      type="button"
                      onClick={onResetFontSize}
                      aria-label="글자 크기 초기화"
                      className="flex items-center gap-1 text-white/40 transition-colors hover:text-white"
                    >
                      <RefreshIcon className="h-3 w-3" />
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={onDecreaseFontSize}
                      disabled={isMinSize}
                      aria-label="글자 크기 줄이기"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs text-white/70">{fontSizePx}px</span>
                    <button
                      type="button"
                      onClick={onIncreaseFontSize}
                      disabled={isMaxSize}
                      aria-label="글자 크기 늘리기"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                    <span>굵기</span>
                    <button
                      type="button"
                      onClick={onResetFontWeight}
                      aria-label="글자 굵기 초기화"
                      className="flex items-center gap-1 text-white/40 transition-colors hover:text-white"
                    >
                      <RefreshIcon className="h-3 w-3" />
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={onDecreaseFontWeight}
                      disabled={isMinWeight}
                      aria-label="글자 굵기 줄이기"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs text-white/70">{fontWeight}</span>
                    <button
                      type="button"
                      onClick={onIncreaseFontWeight}
                      disabled={isMaxWeight}
                      aria-label="글자 굵기 늘리기"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs text-white/50">글꼴</div>
                  <div className="flex gap-2">
                    {FONT_FAMILY_OPTIONS.map((option) => {
                      const isActive = option.id === fontFamily;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => onSelectFontFamily(option.id)}
                          aria-pressed={isActive}
                          className={`flex-1 rounded-full px-3 py-1.5 text-xs transition-colors ${
                            isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* 5. 배경음 추가·삭제 — 목록에서 켜면 화면에 오브가 뜨고, 끄면 사라진다.
                하단 바의 배경음 드롭다운과 동일한 목록(AmbientSoundPicker)을 그대로 써서,
                켜진 소리마다 스위치 대신 우측에 볼륨 슬라이더가 바로 뜨는 형태를 공유한다. */}
            <section className="pt-5">
              <SectionHeading>배경음</SectionHeading>
              <AmbientSoundPicker
                positions={ambientPositions}
                onToggle={onToggleAmbientSound}
                onVolumeChange={onAmbientVolumeChange}
              />
            </section>

            <p className="mt-2 pt-8 text-center text-[10px] text-white/25">ⓒ 2026 cazis</p>
          </div>
        </div>
      </aside>
    </>
  );
}
