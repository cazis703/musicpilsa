"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import AudioController from "@/components/audio/AudioController";
import BackgroundVideoLayer from "@/components/background/BackgroundVideoLayer";
import StarfieldBackground from "@/components/background/StarfieldBackground";
import SentenceTypingArea from "@/components/typing/SentenceTypingArea";
import SkipButton from "@/components/typing/SkipButton";
import ThemeSwitcher from "@/components/typing/ThemeSwitcher";
import { SENTENCE_SET_META } from "@/data/sentences";
import { attemptAutoplay } from "@/hooks/useAudioControls";
import { useBackgroundMedia } from "@/hooks/useBackgroundMedia";
import { useSentenceTyping } from "@/hooks/useSentenceTyping";
import { pickNextSetId } from "@/lib/sentence-utils";

export default function HealingTypingScreen() {
  const {
    currentSentence,
    charStates,
    handleInputValue,
    confirmIfComplete,
    activeSetId,
    setActiveSet,
    skipSentence,
  } = useSentenceTyping();
  const { videoStatus, audioStatus, videoRef, audioRef, videoSrc, audioSrc, nextVideo, nextAudio } =
    useBackgroundMedia();
  const hasAttemptedAutoplayRef = useRef(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const activeSetLabel = useMemo(
    () => SENTENCE_SET_META.find((set) => set.id === activeSetId)?.label ?? "",
    [activeSetId]
  );

  const handleFirstInteraction = useCallback(() => {
    if (hasAttemptedAutoplayRef.current) return;
    hasAttemptedAutoplayRef.current = true;
    attemptAutoplay(audioRef.current);
  }, [audioRef]);

  useEffect(() => {
    hiddenInputRef.current?.focus();
  }, []);

  // 문장이 바뀌면(자동 전환 포함) 입력창도 함께 비워 다음 문장을 처음부터 입력하게 한다.
  useEffect(() => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
    }
  }, [currentSentence.id]);

  const focusHiddenInput = useCallback(() => {
    hiddenInputRef.current?.focus();
  }, []);

  const handleSkip = useCallback(() => {
    skipSentence();
    focusHiddenInput();
  }, [skipSentence, focusHiddenInput]);

  const handleSwitchTheme = useCallback(() => {
    setActiveSet(pickNextSetId(SENTENCE_SET_META, activeSetId));
    focusHiddenInput();
  }, [activeSetId, setActiveSet, focusHiddenInput]);

  // 입력창의 실제 value(브라우저 IME가 조합을 마친 결과만 반영됨)를 정답 문장과
  // 통째로 비교하는 방식이므로, 조합 중간 자모 단계는 자연히 불일치로 무시되고
  // 조합이 완성되는 순간에만 정확히 반영된다. isComposing 분기가 필요 없다.
  const handleInput = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      handleFirstInteraction();
      handleInputValue(event.currentTarget.value);
    },
    [handleInputValue, handleFirstInteraction]
  );

  // <input type="text">는 Enter 키만으로는 value가 바뀌지 않아 onInput이 발생하지 않으므로,
  // 문장을 이미 다 입력한 상태에서 Enter를 눌러도 다음 문장으로 넘어갈 수 있도록 별도 처리한다.
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        confirmIfComplete();
      }
    },
    [confirmIfComplete]
  );

  return (
    <main
      className="relative min-h-screen min-w-[1024px] overflow-hidden bg-slate-950"
      onClick={focusHiddenInput}
    >
      <StarfieldBackground />
      <BackgroundVideoLayer videoRef={videoRef} videoStatus={videoStatus} videoSrc={videoSrc} />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-black/50" />

      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-10">
        <SentenceTypingArea sentence={currentSentence.text} charStates={charStates} />

        <div className="flex flex-col items-center gap-3">
          <input
            ref={hiddenInputRef}
            type="text"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={focusHiddenInput}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="여기에 문장을 따라 입력해 보세요"
            aria-label="위로 문장 입력"
            className="w-[36rem] max-w-[90vw] rounded-full border border-white/20 bg-white/10 px-6 py-3 text-center text-white/90 placeholder:text-white/40 outline-none backdrop-blur focus:border-white/40"
          />
          <div className="flex items-center gap-4">
            <ThemeSwitcher activeSetId={activeSetId} activeLabel={activeSetLabel} onSwitch={handleSwitchTheme} />
            <span className="h-3.5 w-px bg-white/20" aria-hidden="true" />
            <SkipButton onSkip={handleSkip} />
          </div>
        </div>
      </div>

      <AudioController
        audioRef={audioRef}
        audioStatus={audioStatus}
        audioSrc={audioSrc}
        onNextVideo={nextVideo}
        onNextAudio={nextAudio}
      />
    </main>
  );
}
