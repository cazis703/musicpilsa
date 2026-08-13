export function isCorrectChar(inputChar: string, targetChar: string): boolean {
  return inputChar === targetChar;
}

// 오타는 최대 이만큼만(전체 개수 기준) 허용한다 (그 이상의 키 입력은 막는다).
export const MAX_TYPO_LENGTH = 5;

// 문장 길이를 넘는 입력, 그리고 오타 개수가 MAX_TYPO_LENGTH를 넘는 입력을 막는다.
// 오타는 "맨 앞부터 이어지는 정타 구간 다음"이 아니라, 목표 문장과 같은 자리끼리
// 하나하나 비교해서 센다 — 예를 들어 "당신에게"를 "다신에게"로 쳤다면 첫 글자만 오타이고
// 나머지("신에게")는 우연히 자리가 맞아떨어진 정타로 인정한다(타이핑웍스 방식).
export function clampTypedValue(fullValue: string, target: string): string {
  const bounded = fullValue.length > target.length ? fullValue.slice(0, target.length) : fullValue;

  let typoCount = 0;
  for (let i = 0; i < bounded.length; i++) {
    if (!isCorrectChar(bounded[i], target[i])) {
      typoCount++;
      if (typoCount > MAX_TYPO_LENGTH) {
        return bounded.slice(0, i);
      }
    }
  }
  return bounded;
}
