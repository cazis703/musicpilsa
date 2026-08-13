"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickNextSentence } from "@/lib/sentence-utils";
import { isCorrectChar } from "@/lib/typing-judge";
import { SENTENCE_SETS, getSentenceSet } from "@/data/sentences";
import type { CharState } from "@/types/typing";
import type { SentenceItem, SentenceSetId } from "@/types/sentence";

const NEXT_SENTENCE_DELAY_MS = 800;
// 하이드레이션 안전성: Set과 문장 모두 고정 리터럴(첫 번째 Set, 그 안의 첫 문장)로 초기화하고,
// 랜덤화는 반드시 마운트 후 useEffect(빈 deps)에서만 수행한다. Set 자체를 마운트 시점에
// 랜덤으로 고르지 않는다 — 서버/클라이언트 렌더 결과가 달라지는 하이드레이션 불일치를 방지하기 위함.
const INITIAL_SET_ID: SentenceSetId = SENTENCE_SETS[0].id;
const INITIAL_SENTENCE: SentenceItem = SENTENCE_SETS[0].sentences[0];

function createInitialCharStates(text: string): CharState[] {
  return Array.from(text).map((char) => ({
    char,
    status: "pending",
    isTypo: false,
    isComposingChar: false,
    glowStartedAt: null,
  }));
}

export interface UseSentenceTypingReturn {
  currentSentence: SentenceItem;
  charStates: CharState[];
  cursorIndex: number;
  handleInputValue: (fullValue: string, isComposing?: boolean) => void;
  confirmIfComplete: () => void;
  resetCurrentSentence: () => void;
  activeSetId: SentenceSetId;
  setActiveSet: (setId: SentenceSetId) => void;
  skipSentence: () => void;
}

export function useSentenceTyping(
  onCharTyped?: () => void,
  onSentenceComplete?: () => void
): UseSentenceTypingReturn {
  const [activeSetId, setActiveSetId] = useState<SentenceSetId>(INITIAL_SET_ID);
  const [currentSentence, setCurrentSentence] = useState<SentenceItem>(INITIAL_SENTENCE);
  const [charStates, setCharStates] = useState<CharState[]>(() =>
    createInitialCharStates(INITIAL_SENTENCE.text)
  );
  // "지금까지 화면에 표시된(정타든 오타든) 글자 수" — 문장의 맨 앞부터 이어지는 정타
  // 구간의 길이가 아니라, 그냥 입력값의 길이(문장 길이 상한 적용)를 의미한다. 각 글자는
  // 목표 문장의 같은 자리와 개별 비교하므로, 앞쪽에 오타가 있어도 뒤이은 글자가 우연히
  // 자리에 맞으면 정타로 인정된다(타이핑웍스 방식).
  const cursorIndexRef = useRef(0);
  const [cursorIndex, setCursorIndex] = useState(0);
  // 지금 화면에 표시된 오타 개수(자리별 비교 기준, 조합 중인 마지막 글자는 제외).
  // handleInputValue의 "실질적 변화 없음" 판정에 cursorIndex뿐 아니라 이 값도 함께 봐야,
  // 오타 글자 수만 늘거나 줄 때도 갱신된다.
  const typoLengthRef = useRef(0);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 자동 전환/건너뛰기/Set 변경 3곳 모두 "문장을 어떻게 바꾸는가"는 동일한 절차이므로
  // 하나의 공용 함수로 묶어 재사용한다 (previousId를 인자로 받아 연속 반복만 방지).
  const goToNextSentence = useCallback((sentences: SentenceItem[], previousId: number | null) => {
    const next = pickNextSentence(sentences, previousId);
    setCurrentSentence(next);
    setCharStates(createInitialCharStates(next.text));
    cursorIndexRef.current = 0;
    typoLengthRef.current = 0;
    setCursorIndex(0);
    return next;
  }, []);

  useEffect(() => {
    goToNextSentence(SENTENCE_SETS[0].sentences, INITIAL_SENTENCE.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const setActiveSet = useCallback(
    (setId: SentenceSetId) => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
      setActiveSetId(setId);
      const nextSentences = getSentenceSet(setId).sentences;
      // 다른 Set으로 넘어가는 순간이므로 이전 Set 기준의 previousSentenceId 제약은 적용하지 않는다.
      goToNextSentence(nextSentences, null);
    },
    [goToNextSentence]
  );

  const skipSentence = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    const currentSentences = getSentenceSet(activeSetId).sentences;
    goToNextSentence(currentSentences, currentSentence.id);
  }, [activeSetId, currentSentence.id, goToNextSentence]);

  // 매 입력 이벤트마다(한글 조합 중간에도) 즉시 판정한다 — 이미 완성된 글자들의 매칭/
  // 글로우는 뒤에 이어지는 글자의 조합 상태와 무관하게 곧바로 반영되어야 하기 때문이다
  // (여러 음절을 이어 칠 때 브라우저가 그걸 하나의 조합 세션으로 묶어버리는 경우가 흔해서,
  // 조합이 "완전히 끝날 때"까지 기다리면 이미 맞게 친 글자도 여러 글자만큼 늦게 반영된다).
  //
  // 타이핑웍스 방식 판정: 각 글자는 "맨 앞부터 이어지는 정타 구간"이 아니라 목표 문장의
  // 같은 자리와 하나하나 개별 비교한다 — 그래서 "당신에게"를 "다신에게"로 쳤을 때 첫
  // 글자만 오타로 표시되고, 우연히 자리가 맞은 "신에게"는 정타로 인정된다.
  //
  // 지금 한창 조합되고 있는 마지막 한 글자(자음/모음 낱개 단계 포함)는 실제 입력 내용을
  // 그대로 흰색으로 보여주되(isComposingChar), 맞았는지 틀렸는지는 아직 판정하지 않는다.
  // 다음 글자로 넘어가는 순간(=fullValue가 한 글자 더 늘어나는 순간, 조합 세션 자체가
  // 끝나지 않았어도) 그 글자는 더 이상 "마지막 글자"가 아니게 되므로 이 시점에 비로소
  // 정오가 확정되어 흰색(정타) 또는 빨간색(오타)으로 정착된다.
  //
  // fullValue는 호출 전에 이미 clampTypedValue로 오타 5글자/문장 길이 제한이 적용된 값이라고
  // 가정한다 (실제 클램핑은 화면 쪽 onInput 핸들러에서 수행 — <input> DOM 값 자체를 되돌려야
  // 하기 때문). 여기서는 판정/시각 상태 갱신만 담당한다.
  const handleInputValue = useCallback(
    (fullValue: string, isComposing = false) => {
      const target = currentSentence.text;
      const effectiveLength = Math.min(fullValue.length, target.length);
      // 지금 한창 조합 중인 마지막 글자의 위치 (없으면 -1).
      const composingIndex = isComposing && effectiveLength > 0 ? effectiveLength - 1 : -1;

      let typoCount = 0;
      for (let i = 0; i < effectiveLength; i++) {
        if (i === composingIndex) continue; // 조합 중인 글자는 아직 판정하지 않는다.
        if (!isCorrectChar(fullValue[i], target[i])) typoCount++;
      }

      const previousLength = cursorIndexRef.current;

      // 조합 중에는 길이/오타 개수가 그대로여도 조합 중인 글자 내용 자체가 바뀔 수
      // 있으므로(예: "ㅁ" -> "마" -> "망") 항상 갱신한다. 조합 중이 아닐 때만 "실질적
      // 변화 없음"으로 스킵한다.
      if (!isComposing && effectiveLength === previousLength && typoCount === typoLengthRef.current) {
        return;
      }

      onCharTyped?.(); // ★ 타건음 트리거 지점: 정타 전진이든 오타/조합 중 글자 변화든 실제 변화가 있는 입력마다 1회

      const now = performance.now();
      setCharStates((prev) =>
        prev.map((state, i) => {
          if (i >= effectiveLength) {
            // 아직 안 쓴 글자, 또는 백스페이스로 지워져 다시 안 쓴 상태로 돌아간 글자.
            // 예전 상태(status)를 그대로 이어받지 않고 pending으로 완전히 리셋해야,
            // 이미 확정(glowing/settled)됐던 글자를 백스페이스로 지웠을 때 하얀색으로
            // 남아있지 않고 제대로 흐려진다.
            return {
              char: state.char,
              status: "pending",
              isTypo: false,
              isComposingChar: false,
              typedChar: undefined,
              glowStartedAt: null,
            };
          }
          if (i === composingIndex) {
            // 지금 한창 조합 중인 글자: 실제 입력 내용을 흰색으로 그대로 보여주고 판정은 보류한다.
            return { ...state, isTypo: false, isComposingChar: true, typedChar: fullValue[i] };
          }
          if (!isCorrectChar(fullValue[i], target[i])) {
            // 확정된 오타: 목표 글자 대신 사용자가 실제로 입력한 글자를 보여준다.
            return { ...state, isTypo: true, isComposingChar: false, typedChar: fullValue[i] };
          }
          // 정타로 확정: 이전에도 이미 정타로 표시돼 있었다면(글로우/정착 진행 중) 그대로
          // 두고, 이번에 새로 확정된 경우에만 글로우를 새로 시작한다.
          const wasAlreadyShownCorrect = i < previousLength && !state.isTypo && !state.isComposingChar;
          return wasAlreadyShownCorrect
            ? state
            : { ...state, status: "glowing", isTypo: false, isComposingChar: false, typedChar: undefined, glowStartedAt: now };
        })
      );

      // "이번 호출 전에 이미 끝에 도달/완료 상태였는지"는 ref를 갱신하기 전의 이전 값
      // (previousLength/typoLengthRef.current)으로 판단해야 한다.
      const wasAlreadyAtEnd = previousLength === target.length;
      const wasAlreadyComplete = wasAlreadyAtEnd && typoLengthRef.current === 0;
      // 문장 끝까지 다 쳤으면(오타가 남아있어도) 다음 문장으로 넘어간다 — 오타를 끝까지
      // 고치지 못해도 계속 그 문장에 머물러 있지 않도록 한다. 완료음은 오타 없이 정확히
      // 끝냈을 때만 재생한다(수용 기준 유지). 조합 중에는 아직 확정된 게 아니므로 둘 다 보류.
      const reachedEnd = !isComposing && effectiveLength === target.length;
      const isExactMatch = reachedEnd && typoCount === 0;

      cursorIndexRef.current = effectiveLength;
      typoLengthRef.current = typoCount;
      setCursorIndex(effectiveLength);

      if (isExactMatch && !wasAlreadyComplete) {
        onSentenceComplete?.(); // ★ 완료음 트리거 지점: 문장을 끝까지 정확히 완성한 순간에만 1회 재생된다.
      }

      if (reachedEnd && !wasAlreadyAtEnd) {
        if (advanceTimeoutRef.current) {
          clearTimeout(advanceTimeoutRef.current);
        }
        const completedSentenceId = currentSentence.id;
        advanceTimeoutRef.current = setTimeout(() => {
          advanceTimeoutRef.current = null;
          const currentSentences = getSentenceSet(activeSetId).sentences;
          goToNextSentence(currentSentences, completedSentenceId);
        }, NEXT_SENTENCE_DELAY_MS);
      }
    },
    [activeSetId, currentSentence.id, currentSentence.text, goToNextSentence, onCharTyped, onSentenceComplete]
  );

  // 다음 문장으로 넘어가지 않고 같은 문장을 처음 상태로 되돌린다("다시쓰기" 버튼/Esc 단축키용).
  const resetCurrentSentence = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    setCharStates(createInitialCharStates(currentSentence.text));
    cursorIndexRef.current = 0;
    typoLengthRef.current = 0;
    setCursorIndex(0);
  }, [currentSentence.text]);

  // 문장 끝까지 입력한 상태(오타가 남아있어도, 자동 전환 대기 중)에서 Enter 키를 누르면,
  // 800ms 대기를 기다리지 않고 즉시 다음 문장으로 넘어간다. <input type="text">는
  // Enter 키 자체로 value가 바뀌지 않으므로(input 이벤트 미발생) 별도 트리거가 필요하다.
  const confirmIfComplete = useCallback(() => {
    if (cursorIndexRef.current < currentSentence.text.length) return;
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    const currentSentences = getSentenceSet(activeSetId).sentences;
    goToNextSentence(currentSentences, currentSentence.id);
  }, [activeSetId, currentSentence.id, currentSentence.text.length, goToNextSentence]);

  return {
    currentSentence,
    charStates,
    cursorIndex,
    handleInputValue,
    confirmIfComplete,
    resetCurrentSentence,
    activeSetId,
    setActiveSet,
    skipSentence,
  };
}
