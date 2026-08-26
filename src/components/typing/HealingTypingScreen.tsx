"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AmbientOrbLayer from "@/components/audio/AmbientOrbLayer";
import AudioController from "@/components/audio/AudioController";
import BackgroundVideoLayer from "@/components/background/BackgroundVideoLayer";
import StarfieldBackground from "@/components/background/StarfieldBackground";
import LoadingScreen from "@/components/loading/LoadingScreen";
import RewriteButton from "@/components/typing/RewriteButton";
import SentenceTypingArea from "@/components/typing/SentenceTypingArea";
import SettingsDrawer from "@/components/typing/SettingsDrawer";
import SiteTitleBar from "@/components/typing/SiteTitleBar";
import SkipButton from "@/components/typing/SkipButton";
import ThemeSwitcher from "@/components/typing/ThemeSwitcher";
import { SENTENCE_SET_META } from "@/data/sentences";
import { DEFAULT_KEY_SWITCH } from "@/data/keySwitches";
import { attemptAutoplay, DEFAULT_BGM_VOLUME, useAudioControls } from "@/hooks/useAudioControls";
import { useAmbientSounds } from "@/hooks/useAmbientSounds";
import { useBackgroundMedia } from "@/hooks/useBackgroundMedia";
import { DEFAULT_FONT_FAMILY, useFontSettings, type FontFamilyId } from "@/hooks/useFontSettings";
import { DEFAULT_SENTENCE_TONE, useSentenceTone } from "@/hooks/useSentenceTone";
import { useSentenceTyping } from "@/hooks/useSentenceTyping";
import { useSiteTitle } from "@/hooks/useSiteTitle";
import { DEFAULT_SFX_VOLUME, useSoundEffects } from "@/hooks/useSoundEffects";
import { clampTypedValue } from "@/lib/typing-judge";
import type { SentenceSetId, SentenceTone } from "@/types/sentence";

export default function HealingTypingScreen() {
  const { sfxVolume, setSfxVolume, isSfxMuted, toggleSfxMute, keySwitchType, setKeySwitchType, playTypingSound, playClickSound } =
    useSoundEffects();

  const {
    fontSizeRem,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    fontWeight,
    increaseFontWeight,
    decreaseFontWeight,
    resetFontWeight,
    fontFamily,
    setFontFamily,
    fontStyle,
  } = useFontSettings();

  const { tone, setTone } = useSentenceTone();
  const { recipientName, setRecipientName, isVisible: isTitleVisible, hideTitle, showTitle } = useSiteTitle();

  const {
    currentSentence,
    targetText,
    charStates,
    cursorIndex,
    handleInputValue,
    confirmIfComplete,
    resetCurrentSentence,
    activeSetId,
    setActiveSet,
    skipSentence,
  } = useSentenceTyping(tone, playTypingSound);
  const { videoStatus, audioStatus, videoRef, audioRef, videoSrc, audioSrc, nextVideo, nextAudio, previousAudio } =
    useBackgroundMedia();
  const { isMuted, volume, isPlaying, toggleMute, setVolume, togglePlay } = useAudioControls(audioRef);
  const {
    activeIds: ambientActiveIds,
    positions: ambientPositions,
    toggleSound: toggleAmbientSound,
    setPosition: setAmbientPosition,
    setVolume: setAmbientVolume,
    resumeAll: resumeAmbientSounds,
  } = useAmbientSounds();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const hasAttemptedAutoplayRef = useRef(false);
  const typingInputRef = useRef<HTMLInputElement>(null);

  const handleFirstInteraction = useCallback(() => {
    if (hasAttemptedAutoplayRef.current) return;
    hasAttemptedAutoplayRef.current = true;
    attemptAutoplay(audioRef.current);
    resumeAmbientSounds();
  }, [audioRef, resumeAmbientSounds]);

  // 이전엔 이 재시도가 타이핑 입력창의 onInput(=실제로 한 글자를 쳐야만)에만 연결돼 있어서,
  // 문장을 치기 전까지는 배경음악도 배경음(오브)도 전혀 재생되지 않는 버그가 있었다.
  // 브라우저 자동재생 정책상 "진짜 사용자 제스처" 없이는 소리를 낼 수 없지만, 그 제스처가
  // 꼭 타이핑일 필요는 없다 — 화면 아무 곳이나 클릭하거나 키를 한 번만 눌러도 충분하므로
  // window에 캡처 단계로 붙여 페이지 전체에서 가장 먼저 일어나는 제스처를 잡는다.
  useEffect(() => {
    window.addEventListener("pointerdown", handleFirstInteraction, { capture: true });
    window.addEventListener("keydown", handleFirstInteraction, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction, { capture: true });
      window.removeEventListener("keydown", handleFirstInteraction, { capture: true });
    };
  }, [handleFirstInteraction]);

  // 배경 영상이 준비되면(성공/실패 무관, 기존 3초 타임아웃 로직 그대로 재사용) 로딩 화면을
  // 내린다. 다만 로딩이 너무 빨리 끝나면 프로그레스 바가 깜빡이듯 스치기만 하고 사라져
  // 오히려 어색하므로, 최소 노출 시간을 둬서 그보다 빨리 끝나도 그만큼은 채워서 보여준다.
  const MIN_LOADING_MS = 550;
  const [isAppReady, setIsAppReady] = useState(false);
  const loadStartRef = useRef<number>(Date.now());
  useEffect(() => {
    if (videoStatus === "loading") return;
    const elapsed = Date.now() - loadStartRef.current;
    const timer = setTimeout(() => setIsAppReady(true), Math.max(0, MIN_LOADING_MS - elapsed));
    return () => clearTimeout(timer);
  }, [videoStatus]);

  useEffect(() => {
    typingInputRef.current?.focus();
  }, []);

  // 문장이 바뀌거나(자동 전환 포함) 톤이 바뀌어 목표 텍스트 자체가 달라지면, 입력창도
  // 함께 비워 처음부터 다시 입력하게 한다.
  useEffect(() => {
    if (typingInputRef.current) {
      typingInputRef.current.value = "";
    }
  }, [currentSentence.id, targetText]);

  const focusTypingInput = useCallback(() => {
    typingInputRef.current?.focus();
  }, []);

  // 타이핑 입력창은 블러되면 즉시 자기 자신에게 포커스를 되돌려 사용자가 실수로
  // 다른 곳(버튼 등)을 클릭해도 타이핑을 이어갈 수 있게 한다. 다만 사이트 제목
  // 이름 입력창처럼 텍스트를 직접 타이핑해야 하는 다른 <input>/<textarea>로
  // 포커스가 이동하는 중이라면 그 입력을 가로채면 안 되므로 재포커스를 건너뛴다.
  const handleTypingInputBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const nextTarget = event.relatedTarget as HTMLElement | null;
    if (nextTarget && (nextTarget.tagName === "INPUT" || nextTarget.tagName === "TEXTAREA")) {
      return;
    }
    focusTypingInput();
  }, [focusTypingInput]);

  // ★ 클릭음 트리거 지점: 기존 핸들러를 그대로 감싸는 방식으로, 각 컴포넌트(AudioController,
  // SkipButton, ThemeSwitcher, RewriteButton) 자체는 수정하지 않고 HealingTypingScreen에서 조립만 담당한다.
  const handleNextVideo = useCallback(() => {
    playClickSound();
    nextVideo();
  }, [playClickSound, nextVideo]);

  const handleNextAudio = useCallback(() => {
    playClickSound();
    nextAudio();
  }, [playClickSound, nextAudio]);

  const handlePreviousAudio = useCallback(() => {
    playClickSound();
    previousAudio();
  }, [playClickSound, previousAudio]);

  const handleSkip = useCallback(() => {
    playClickSound();
    skipSentence();
    focusTypingInput();
  }, [playClickSound, skipSentence, focusTypingInput]);

  const handleSelectSet = useCallback(
    (setId: SentenceSetId) => {
      playClickSound();
      setActiveSet(setId);
      focusTypingInput();
    },
    [playClickSound, setActiveSet, focusTypingInput]
  );

  const handleIncreaseFontSize = useCallback(() => {
    playClickSound();
    increaseFontSize();
  }, [playClickSound, increaseFontSize]);

  const handleDecreaseFontSize = useCallback(() => {
    playClickSound();
    decreaseFontSize();
  }, [playClickSound, decreaseFontSize]);

  const handleResetFontSize = useCallback(() => {
    playClickSound();
    resetFontSize();
  }, [playClickSound, resetFontSize]);

  const handleIncreaseFontWeight = useCallback(() => {
    playClickSound();
    increaseFontWeight();
  }, [playClickSound, increaseFontWeight]);

  const handleDecreaseFontWeight = useCallback(() => {
    playClickSound();
    decreaseFontWeight();
  }, [playClickSound, decreaseFontWeight]);

  const handleResetFontWeight = useCallback(() => {
    playClickSound();
    resetFontWeight();
  }, [playClickSound, resetFontWeight]);

  const handleSelectFontFamily = useCallback(
    (id: FontFamilyId) => {
      playClickSound();
      setFontFamily(id);
    },
    [playClickSound, setFontFamily]
  );

  const handleSelectTone = useCallback(
    (nextTone: SentenceTone) => {
      playClickSound();
      setTone(nextTone);
    },
    [playClickSound, setTone]
  );

  const handleToggleAmbientSound = useCallback(
    (id: Parameters<typeof toggleAmbientSound>[0]) => {
      playClickSound();
      toggleAmbientSound(id);
    },
    [playClickSound, toggleAmbientSound]
  );

  const handleOpenSettings = useCallback(() => {
    playClickSound();
    setIsSettingsOpen(true);
  }, [playClickSound]);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  // 문장 Set 자체(지금 읽고 있는 콘텐츠)는 건드리지 않고, 조절 가능한 "설정값"만 기본값으로
  // 되돌린다 — 톤/타이틀/볼륨·타건음/폰트.
  const handleResetAllSettings = useCallback(() => {
    playClickSound();
    setTone(DEFAULT_SENTENCE_TONE);
    setRecipientName("");
    showTitle();
    setVolume(DEFAULT_BGM_VOLUME);
    if (isMuted) toggleMute();
    setSfxVolume(DEFAULT_SFX_VOLUME);
    if (isSfxMuted) toggleSfxMute();
    setKeySwitchType(DEFAULT_KEY_SWITCH);
    resetFontSize();
    resetFontWeight();
    setFontFamily(DEFAULT_FONT_FAMILY);
  }, [
    playClickSound,
    setTone,
    setRecipientName,
    showTitle,
    setVolume,
    isMuted,
    toggleMute,
    setSfxVolume,
    isSfxMuted,
    toggleSfxMute,
    setKeySwitchType,
    resetFontSize,
    resetFontWeight,
    setFontFamily,
  ]);

  // 같은 문장을 처음 상태로 되돌린다. 판정 상태(useSentenceTyping)뿐 아니라 실제 <input> DOM
  // 값도 비워야 하는데, 그 입력창이 uncontrolled라 여기서 직접 value를 지워준다.
  const handleRewrite = useCallback(() => {
    playClickSound();
    resetCurrentSentence();
    if (typingInputRef.current) {
      typingInputRef.current.value = "";
    }
    focusTypingInput();
  }, [playClickSound, resetCurrentSentence, focusTypingInput]);

  // 오타 5글자 제한(문장 끝을 넘어서는 입력도 함께 차단): 브라우저가 이미 DOM에 써버린
  // 값을 clampTypedValue로 확인해, 허용 범위를 넘었다면 입력창 값 자체를 그 자리에서
  // 잘라내고 커서를 끝으로 되돌려 "애초에 입력이 안 된 것"처럼 만든다.
  //
  // 조합(isComposing) 중에는 <input> DOM 값을 직접 잘라내면 IME 조합 세션이 깨질 수
  // 있으므로 값은 건드리지 않고, 화면 표시(글로우/오타)만 조합 중 상태로 갱신한다.
  // 5글자/문장 길이 제한은 조합이 끝나는 시점(비조합 입력 또는 onCompositionEnd)에
  // 다시 정확히 적용된다.
  const evaluateInputValue = useCallback(
    (inputEl: HTMLInputElement, isComposing: boolean) => {
      if (isComposing) {
        handleInputValue(inputEl.value, true);
        return;
      }
      const raw = inputEl.value;
      const clamped = clampTypedValue(raw, targetText);
      if (clamped !== raw) {
        inputEl.value = clamped;
        inputEl.setSelectionRange(clamped.length, clamped.length);
      }
      handleInputValue(clamped);
    },
    [handleInputValue, targetText]
  );

  // 매 입력 이벤트마다(한글 조합 중간에도) 곧바로 판정을 돌린다 — 이미 완성된 앞 글자의
  // 매칭/글로우가 뒤에 이어지는 글자의 조합 상태 때문에 늦어지면 안 되기 때문이다.
  // "지금 한창 조합 중인 마지막 한 글자"를 오타로 오판하지 않는 처리는
  // useSentenceTyping의 handleInputValue(isComposing 인자)에서 담당한다.
  const handleInput = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      handleFirstInteraction();
      const isComposing = (event.nativeEvent as InputEvent).isComposing ?? false;
      evaluateInputValue(event.currentTarget, isComposing);
    },
    [handleFirstInteraction, evaluateInputValue]
  );

  const handleCompositionEnd = useCallback(
    (event: React.CompositionEvent<HTMLInputElement>) => {
      evaluateInputValue(event.currentTarget, false);
    },
    [evaluateInputValue]
  );

  // <input type="text">는 Enter 키만으로는 value가 바뀌지 않아 onInput이 발생하지 않으므로,
  // 문장을 이미 다 입력한 상태에서 Enter를 눌러도 다음 문장으로 넘어갈 수 있도록 별도 처리한다.
  // 문장을 다 친 상태(커서가 끝에 도달)에서는 스페이스바도 동일하게 "전송" 단축키로 취급하고
  // 기본 동작(공백 삽입)을 막는다. 문장이 아직 끝나지 않았을 때는 스페이스가 문장 중간의
  // 정타(단어 사이 공백)로 쓰일 수 있으므로 그대로 입력되게 둔다. Esc는 "다시쓰기" 단축키.
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        confirmIfComplete();
      } else if (event.key === " " || event.code === "Space") {
        if (cursorIndex >= targetText.length) {
          event.preventDefault();
          confirmIfComplete();
        }
      } else if (event.key === "Escape") {
        handleRewrite();
      }
    },
    [confirmIfComplete, handleRewrite, cursorIndex, targetText.length]
  );

  const activeSetLabel =
    SENTENCE_SET_META.find((set) => set.id === activeSetId)?.label ?? SENTENCE_SET_META[0].label;

  return (
    <main
      className="relative min-h-screen min-w-[1024px] overflow-hidden bg-slate-950"
      onClick={focusTypingInput}
    >
      <StarfieldBackground />
      <BackgroundVideoLayer videoRef={videoRef} videoStatus={videoStatus} videoSrc={videoSrc} />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-black/50" />

      <LoadingScreen isReady={isAppReady} />

      <div
        onClick={(event) => event.stopPropagation()}
        className={isAppReady ? "animate-fade-up-in" : "opacity-0"}
      >
        <SiteTitleBar
          recipientName={recipientName}
          onRecipientNameChange={setRecipientName}
          setLabel={activeSetLabel}
          isVisible={isTitleVisible}
          onHide={hideTitle}
          onShow={showTitle}
          titleFontFamily={fontStyle.fontFamily ?? "var(--font-sans)"}
        />
      </div>

      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-10">
        <div
          className={isAppReady ? "animate-fade-up-in" : "opacity-0"}
          style={isAppReady ? { animationDelay: "90ms" } : undefined}
        >
          <SentenceTypingArea
            sentence={targetText}
            charStates={charStates}
            inputRef={typingInputRef}
            fontStyle={fontStyle}
            onInput={handleInput}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
            onBlur={handleTypingInputBlur}
          />
        </div>

        <div
          className={`flex items-center gap-4 ${isAppReady ? "animate-fade-up-in" : "opacity-0"}`}
          style={isAppReady ? { animationDelay: "160ms" } : undefined}
        >
          <ThemeSwitcher sets={SENTENCE_SET_META} activeSetId={activeSetId} onSelect={handleSelectSet} />
          <span className="h-3.5 w-px bg-white/20" aria-hidden="true" />
          <RewriteButton onRewrite={handleRewrite} />
          <span className="h-3.5 w-px bg-white/20" aria-hidden="true" />
          <SkipButton onSkip={handleSkip} />
        </div>
      </div>

      <AmbientOrbLayer
        positions={ambientPositions}
        onPositionChange={setAmbientPosition}
        onVolumeChange={setAmbientVolume}
        onRemove={toggleAmbientSound}
      />

      <AudioController
        audioRef={audioRef}
        audioStatus={audioStatus}
        audioSrc={audioSrc}
        onNextVideo={handleNextVideo}
        onNextAudio={handleNextAudio}
        onPreviousAudio={handlePreviousAudio}
        isMuted={isMuted}
        volume={volume}
        isPlaying={isPlaying}
        toggleMute={toggleMute}
        setVolume={setVolume}
        togglePlay={togglePlay}
        sfxVolume={sfxVolume}
        onSfxVolumeChange={setSfxVolume}
        isSfxMuted={isSfxMuted}
        onToggleSfxMute={toggleSfxMute}
        keySwitchType={keySwitchType}
        onKeySwitchTypeChange={setKeySwitchType}
        onOpenSettings={handleOpenSettings}
        isRevealed={isAppReady}
        revealDelayMs={220}
      />

      {/* SettingsDrawer 안에는 이름 입력창이 있어서 SiteTitleBar와 마찬가지로 클릭이
          main까지 전파되면 안 된다 — 그러지 않으면 클릭할 때마다 main의 onClick이
          타이핑 입력창으로 포커스를 다시 빼앗아가 버려서 안의 입력창에 타이핑이 안 된다. */}
      <div onClick={(event) => event.stopPropagation()}>
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        onResetAll={handleResetAllSettings}
        sets={SENTENCE_SET_META}
        activeSetId={activeSetId}
        onSelectSet={handleSelectSet}
        tone={tone}
        onSelectTone={handleSelectTone}
        recipientName={recipientName}
        onRecipientNameChange={setRecipientName}
        isTitleVisible={isTitleVisible}
        onHideTitle={hideTitle}
        onShowTitle={showTitle}
        onNextVideo={handleNextVideo}
        musicVolume={volume}
        isMusicMuted={isMuted}
        onMusicVolumeChange={setVolume}
        onToggleMusicMute={toggleMute}
        sfxVolume={sfxVolume}
        isSfxMuted={isSfxMuted}
        onSfxVolumeChange={setSfxVolume}
        onToggleSfxMute={toggleSfxMute}
        keySwitchType={keySwitchType}
        onKeySwitchTypeChange={setKeySwitchType}
        fontSizeRem={fontSizeRem}
        onIncreaseFontSize={handleIncreaseFontSize}
        onDecreaseFontSize={handleDecreaseFontSize}
        onResetFontSize={handleResetFontSize}
        fontWeight={fontWeight}
        onIncreaseFontWeight={handleIncreaseFontWeight}
        onDecreaseFontWeight={handleDecreaseFontWeight}
        onResetFontWeight={handleResetFontWeight}
        fontFamily={fontFamily}
        onSelectFontFamily={handleSelectFontFamily}
        ambientActiveIds={ambientActiveIds}
        onToggleAmbientSound={handleToggleAmbientSound}
      />
      </div>
    </main>
  );
}
