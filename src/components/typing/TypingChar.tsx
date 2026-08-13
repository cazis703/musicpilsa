import { forwardRef, useEffect, useRef } from "react";
import type { CharStatus } from "@/types/typing";

interface TypingCharProps {
  char: string;
  typedChar?: string;
  state: CharStatus;
  isTypo: boolean;
  isComposingChar: boolean;
  onGlowStart?: (x: number, y: number) => void;
}

const STATUS_CLASS: Record<CharStatus, string> = {
  pending: "text-white/35",
  glowing: "text-white animate-glow-in",
  settled: "text-white", // 종착 상태 — 사라지지 않고 하얀색으로 계속 남는다.
};

// 부모(SentenceTypingArea)가 이 글자의 실제 화면 좌표를 읽어 커서를 직접 그려야 하므로
// span을 밖으로 노출한다(forwardRef). 글로우 이펙트용 내부 측정에도 같은 엘리먼트를 재사용한다.
const TypingChar = forwardRef<HTMLSpanElement, TypingCharProps>(function TypingChar(
  { char, typedChar, state, isTypo, isComposingChar, onGlowStart },
  forwardedRef
) {
  const localRef = useRef<HTMLSpanElement | null>(null);

  const setRefs = (el: HTMLSpanElement | null) => {
    localRef.current = el;
    if (typeof forwardedRef === "function") {
      forwardedRef(el);
    } else if (forwardedRef) {
      forwardedRef.current = el;
    }
  };

  useEffect(() => {
    if (state !== "glowing" || !onGlowStart) return;
    const el = localRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    onGlowStart(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [state, onGlowStart]);

  // 지금 한창 한글 자모로 조합 중인 글자: 아직 정오 판정 전이므로 실제 입력 내용(자음
  // 하나만 친 상태 포함)을 흰색으로 그대로 보여준다. 다음 글자로 넘어가면 이 자리는
  // isComposingChar가 false가 되며 정타(글로우)/오타(빨간색) 중 하나로 확정된다.
  if (isComposingChar) {
    return (
      <span ref={setRefs} className="inline-block whitespace-pre text-white">
        {typedChar ?? char}
      </span>
    );
  }

  // 오타 구간: 목표 글자 대신 실제로 입력한 글자를 빨간색으로 보여준다. 글로우/정착
  // 애니메이션 클래스는 적용하지 않는다 — 오타 상태에서는 애니메이션 자체가 멈춰야 하기 때문
  // (전체 정지는 useCharEffects가 담당하고, 여기서는 오타 글자를 항상 정적으로만 표시한다).
  if (isTypo) {
    return (
      <span ref={setRefs} className="inline-block whitespace-pre text-red-400">
        {typedChar ?? char}
      </span>
    );
  }

  return (
    <span ref={setRefs} className={`inline-block whitespace-pre ${STATUS_CLASS[state]}`}>
      {char}
    </span>
  );
});

export default TypingChar;
