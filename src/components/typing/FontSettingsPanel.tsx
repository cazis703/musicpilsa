"use client";

import { useEffect, useRef, useState } from "react";
import { MinusIcon, PlusIcon, RefreshIcon, TextSizeIcon } from "@/components/ui/icons";
import {
  MAX_FONT_SIZE_REM,
  MAX_FONT_WEIGHT,
  MIN_FONT_SIZE_REM,
  MIN_FONT_WEIGHT,
  type FontFamilyId,
} from "@/hooks/useFontSettings";
import type { SentenceSetId, SentenceTone } from "@/types/sentence";

interface FontSettingsPanelProps {
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
  tone: SentenceTone;
  onSelectTone: (tone: SentenceTone) => void;
  activeSetId: SentenceSetId;
}

// "위로" Set은 청자가 "당신"이라 하다체로 바꾸면 반말처럼 들려 어색하므로, 하다체/습니다체
// 버전 자체가 데이터에 없다(resolveSentenceText가 해요체로 fallback). 그 Set을 보는 중엔
// 톤 버튼을 눌러도 아무 효과가 없으므로 아예 비활성화하고 이유를 툴팁으로 안내한다.
const TONE_UNAVAILABLE_SET_ID: SentenceSetId = "healing";
const TONE_UNAVAILABLE_MESSAGE = "'위로' Set는 문장 톤을 변경할 수 없어요.";

const FONT_FAMILY_OPTIONS: { id: FontFamilyId; label: string }[] = [
  { id: "sans", label: "Sans-serif" },
  { id: "serif", label: "Serif" },
];

const SENTENCE_TONE_OPTIONS: { id: SentenceTone; label: string }[] = [
  { id: "haeyo", label: "부드럽게" },
  { id: "formal", label: "건조하게" },
  { id: "polite", label: "공손하게" },
];

export default function FontSettingsPanel({
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
  tone,
  onSelectTone,
  activeSetId,
}: FontSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isToneTooltipVisible, setIsToneTooltipVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ThemeSwitcher와 동일하게 바깥 클릭 또는 Esc로 패널을 닫는다.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const fontSizePx = Math.round(fontSizeRem * 16);
  const isMinSize = fontSizeRem <= MIN_FONT_SIZE_REM;
  const isMaxSize = fontSizeRem >= MAX_FONT_SIZE_REM;
  const isMinWeight = fontWeight <= MIN_FONT_WEIGHT;
  const isMaxWeight = fontWeight >= MAX_FONT_WEIGHT;
  const isToneUnavailable = activeSetId === TONE_UNAVAILABLE_SET_ID;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="글자 설정 (눌러서 크기·굵기·글꼴 변경)"
        className="text-white/70 transition-colors hover:text-white"
      >
        <TextSizeIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="글자 설정"
          className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur"
        >
          <div className="flex flex-col gap-4">
            {/* 크기 */}
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
                  초기화
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

            {/* 굵기 */}
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
                  초기화
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

            {/* 글꼴 */}
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

            {/* 문장 톤 — 네이티브 title 툴팁은 disabled 버튼 위에서 포인터 이벤트가
                막혀 부모까지 hover가 전달되지 않는 브라우저가 있어 뜨지 않는 경우가
                있으므로, 직접 상태로 관리하는 툴팁을 사용한다. */}
            <div>
              <div className="mb-2 text-xs text-white/50">문장 톤</div>
              <div
                className="relative flex gap-1.5"
                onMouseEnter={() => isToneUnavailable && setIsToneTooltipVisible(true)}
                onMouseLeave={() => setIsToneTooltipVisible(false)}
              >
                {isToneUnavailable && isToneTooltipVisible && (
                  <div
                    role="tooltip"
                    className="absolute bottom-full left-1/2 mb-2 w-max max-w-[15rem] -translate-x-1/2 rounded-lg bg-zinc-200 px-3 py-1.5 text-[11px] text-zinc-900 shadow-lg"
                  >
                    {TONE_UNAVAILABLE_MESSAGE}
                  </div>
                )}
                {SENTENCE_TONE_OPTIONS.map((option) => {
                  const isActive = option.id === tone;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        if (isToneUnavailable) return;
                        onSelectTone(option.id);
                      }}
                      aria-disabled={isToneUnavailable}
                      aria-pressed={isActive}
                      className={`flex-1 rounded-full px-2 py-1.5 text-xs transition-colors ${
                        isToneUnavailable
                          ? "text-white/30"
                          : isActive
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
