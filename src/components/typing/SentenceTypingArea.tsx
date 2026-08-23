"use client";

import { useLayoutEffect, useRef, useState } from "react";
import CharParticleCanvas, {
  type CharParticleCanvasHandle,
} from "@/components/typing/CharParticleCanvas";
import TypingChar from "@/components/typing/TypingChar";
import { useCharEffects } from "@/hooks/useCharEffects";
import { PARTICLES_PER_CHAR } from "@/lib/particle-utils";
import type { CharState } from "@/types/typing";

interface SentenceTypingAreaProps {
  sentence: string;
  charStates: CharState[];
  inputRef: React.RefObject<HTMLInputElement>;
  fontStyle: React.CSSProperties;
  onInput: (event: React.FormEvent<HTMLInputElement>) => void;
  onCompositionEnd: (event: React.CompositionEvent<HTMLInputElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
}

// 목표 문장 레이어와 입력창이 반드시 같은 폰트 크기/굵기/자간으로 렌더링되어야
// 글자 위치가 어긋나지 않는다. 자간(tracking-wide)은 고정 클래스로 공유하고,
// 크기/굵기/패밀리는 사용자가 조절 가능하므로 fontStyle prop(동일 객체)을 두 요소에
// 그대로 전달해 서로 따로 놀 위험이 없게 한다.
const TYPING_FONT_CLASS = "tracking-wide";

interface CaretRect {
  left: number;
  top: number;
  height: number;
}

// 오타/조합 중 글자까지 포함해 "지금 화면에 타이핑된 것으로 보이는" 글자 수. 정타든
// 오타든 조합 중이든 이 인덱스 앞은 이미 쓴 것으로, 뒤는 아직 안 쓴 것(pending)으로
// 취급한다 — 우리 모델에서는 항상 "정타 구간 + 조합 중 글자(있다면 1개) + 오타 구간 +
// 나머지 pending" 순서로만 나타나므로, 맨 처음 만나는 순수 pending 위치가 곧 그 경계다.
function computeTypedLength(charStates: CharState[]): number {
  const firstUntouched = charStates.findIndex(
    (c) => c.status === "pending" && !c.isTypo && !c.isComposingChar
  );
  return firstUntouched === -1 ? charStates.length : firstUntouched;
}

export default function SentenceTypingArea({
  sentence,
  charStates,
  inputRef,
  fontStyle,
  onInput,
  onCompositionEnd,
  onKeyDown,
  onBlur,
}: SentenceTypingAreaProps) {
  const { visualCharStates } = useCharEffects(charStates);
  const particleHandleRef = useRef<CharParticleCanvasHandle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [caretRect, setCaretRect] = useState<CaretRect | null>(null);

  const handleGlowStart = (x: number, y: number) => {
    particleHandleRef.current?.spawnAt(x, y, PARTICLES_PER_CHAR);
  };

  // 보이지 않는 <input>의 브라우저 기본 커서에 의존하지 않고, 실제로 화면에 그려진 글자
  // span의 좌표를 직접 읽어 커서 위치를 계산한다. 두 레이어(글자 표시용 <p> / 입력용
  // <input>)가 각각 독립적으로 텍스트를 그리는 과정에서 생기는 미세한 폭 차이(특히 글자를
  // 하나씩 개별 span으로 그릴 때와 문자열을 통째로 그릴 때의 자간 계산 차이)가 누적되어
  // 커서가 점점 어긋나는 문제를 근본적으로 피하기 위함 — 커서는 항상 "실제로 그 자리에
  // 그려진 글자"를 기준으로만 위치가 정해진다.
  useLayoutEffect(() => {
    const updateCaretRect = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const typedLength = computeTypedLength(charStates);

      const rectOf = (el: HTMLSpanElement | null) => el?.getBoundingClientRect() ?? null;

      if (typedLength < charRefs.current.length) {
        const rect = rectOf(charRefs.current[typedLength]);
        if (rect) {
          setCaretRect({ left: rect.left - containerRect.left, top: rect.top - containerRect.top, height: rect.height });
          return;
        }
      }
      // 문장을 끝까지 입력한 경우: 마지막 글자의 오른쪽 끝에 커서를 둔다.
      const lastRect = rectOf(charRefs.current[charRefs.current.length - 1]);
      if (lastRect) {
        setCaretRect({ left: lastRect.right - containerRect.left, top: lastRect.top - containerRect.top, height: lastRect.height });
      }
    };

    updateCaretRect();
    window.addEventListener("resize", updateCaretRect);
    return () => window.removeEventListener("resize", updateCaretRect);
    // fontStyle이 바뀌면(크기/굵기/패밀리 조절) 글자 폭이 달라지므로 커서를 다시 계산해야 한다.
  }, [charStates, sentence, fontStyle]);

  return (
    <div ref={containerRef} className="relative px-8 py-10" role="group">
      {/* 흐린 목표 문장 레이어 — 실제로 눈에 보이는 글자는 전부 여기서 그려진다.
          스크린 리더에는 각 글자를 낱개 span으로 읽히는 대신, 아래 입력창의 aria-label로
          문장 전체를 한 번에 안내한다. */}
      <p
        className={`whitespace-nowrap text-left leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] ${TYPING_FONT_CLASS}`}
        style={fontStyle}
        aria-hidden="true"
      >
        {visualCharStates.map((charState, index) => (
          <TypingChar
            key={`${sentence}-${index}`}
            ref={(el) => {
              charRefs.current[index] = el;
            }}
            char={charState.char}
            typedChar={charState.typedChar}
            state={charState.status}
            isTypo={charState.isTypo}
            isComposingChar={charState.isComposingChar}
            onGlowStart={handleGlowStart}
          />
        ))}
      </p>

      {/* 직접 그리는 커서 — 위에서 계산한 실제 글자 좌표를 그대로 사용한다. */}
      {caretRect && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute w-[2px] animate-caret-blink bg-white"
          style={{ left: caretRect.left, top: caretRect.top, height: caretRect.height }}
        />
      )}

      {/* 실제 입력을 받는 투명 입력창 — 텍스트와 브라우저 기본 커서 모두 완전히 투명하다
          (커서는 위에서 직접 그린 것만 보인다). 위치/크기는 위 문장 레이어와 동일한
          박스(inset-0 + 동일 padding/폰트)를 공유해 클릭 시 포커스가 자연스럽게 잡히고
          IME 조합이 정상 동작하도록 한다. */}
      <input
        ref={inputRef}
        type="text"
        onInput={onInput}
        onCompositionEnd={onCompositionEnd}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        autoFocus
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={`위로 문장 입력: ${sentence}`}
        className={`absolute inset-0 m-0 whitespace-nowrap border-0 bg-transparent p-0 text-left leading-relaxed text-transparent caret-transparent outline-none ${TYPING_FONT_CLASS}`}
        style={fontStyle}
      />

      <CharParticleCanvas handleRef={particleHandleRef} />
    </div>
  );
}
