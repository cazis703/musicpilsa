"use client";

import { useCallback, useEffect, useRef } from "react";
import AudioController from "@/components/audio/AudioController";
import BackgroundVideoLayer from "@/components/background/BackgroundVideoLayer";
import StarfieldBackground from "@/components/background/StarfieldBackground";
import RewriteButton from "@/components/typing/RewriteButton";
import SentenceTypingArea from "@/components/typing/SentenceTypingArea";
import SkipButton from "@/components/typing/SkipButton";
import ThemeSwitcher from "@/components/typing/ThemeSwitcher";
import { SENTENCE_SET_META } from "@/data/sentences";
import { attemptAutoplay } from "@/hooks/useAudioControls";
import { useBackgroundMedia } from "@/hooks/useBackgroundMedia";
import { useFontSettings, type FontFamilyId } from "@/hooks/useFontSettings";
import { useSentenceTone } from "@/hooks/useSentenceTone";
import { useSentenceTyping } from "@/hooks/useSentenceTyping";
import { useSoundEffects } from "@/hooks/useSoundEffects";
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
  const hasAttemptedAutoplayRef = useRef(false);
  const typingInputRef = useRef<HTMLInputElement>(null);

  const handleFirstInteraction = useCallback(() => {
    if (hasAttemptedAutoplayRef.current) return;
    hasAttemptedAutoplayRef.current = true;
    attemptAutoplay(audioRef.current);
  }, [audioRef]);

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

  return (
    <main
      className="relative min-h-screen min-w-[1024px] overflow-hidden bg-slate-950"
      onClick={focusTypingInput}
    >
      <StarfieldBackground />
      <BackgroundVideoLayer videoRef={videoRef} videoStatus={videoStatus} videoSrc={videoSrc} />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-black/50" />

      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-10">
        <SentenceTypingArea
          sentence={targetText}
          charStates={charStates}
          inputRef={typingInputRef}
          fontStyle={fontStyle}
          onInput={handleInput}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
          onBlur={focusTypingInput}
        />

        <div className="flex items-center gap-4">
          <ThemeSwitcher sets={SENTENCE_SET_META} activeSetId={activeSetId} onSelect={handleSelectSet} />
          <span className="h-3.5 w-px bg-white/20" aria-hidden="true" />
          <RewriteButton onRewrite={handleRewrite} />
          <span className="h-3.5 w-px bg-white/20" aria-hidden="true" />
          <SkipButton onSkip={handleSkip} />
        </div>
      </div>

      <AudioController
        audioRef={audioRef}
        audioStatus={audioStatus}
        audioSrc={audioSrc}
        onNextVideo={handleNextVideo}
        onNextAudio={handleNextAudio}
        onPreviousAudio={handlePreviousAudio}
        sfxVolume={sfxVolume}
        onSfxVolumeChange={setSfxVolume}
        isSfxMuted={isSfxMuted}
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
        tone={tone}
        onSelectTone={handleSelectTone}
        activeSetId={activeSetId}
      />
    </main>
  );
}
