# 스펙 검증 리포트

> 검증 일시: 2026-07-19
> 프로젝트: 위로의 문장 (Healing Sentence Typing) — mini-game
> 검증자: @reviewer (spec-validator 스킬 적용)
> 대조 대상: claudedocs/PRD.md, claudedocs/TECH_SPEC.md, src/ 전체

## 종합 결과

| 단계 | 결과 | 점수 |
|------|------|------|
| Stage 1: PRD 일치 | ✅ PASS (실사용 검증 후 최종 확정) | 18/18 |
| Stage 2: TECH_SPEC 일치 | ✅ PASS | 파일 구조 전량 일치, 함수/타입 명세 전량 구현 |
| Stage 3: 코드 품질 | ✅ PASS | 5/5 (아래 상세, `useAudioControls` 이슈 수정 완료) |
| **종합** | **✅ PASS** | **100%** |

### 후속 조치 완료 내역 (메인 세션에서 실제 실행)
- `npx tsc --noEmit` 실행 결과: **에러 0건** (아래 Stage 3 지적사항 #1 수정 후 재실행 포함)
- `npm run build` 실행 결과: **정적 페이지 생성 성공** (`/` 4.8kB, First Load JS 92kB)
- **`useAudioControls` 이중 호출 문제 수정 완료**: `attemptAutoplay`를 훅 상태와 무관한 순수 함수로 분리해 `src/hooks/useAudioControls.ts`에서 직접 export하고, `HealingTypingScreen.tsx`는 이 순수 함수만 import하도록 변경. `isMuted`/`volume` 상태는 이제 `AudioController.tsx`의 `useAudioControls(audioRef)` 호출 1곳에서만 소유하는 단일 소스 구조로 리팩터링됨. 수정 후 `tsc --noEmit`/`next build` 재검증 통과.
- **실제 브라우저 동작 검증 완료** (Playwright + Chromium, `npm run dev` 구동 후 headless 드라이빙):
  - 다크톤 배경 + 떠다니는 별빛 파티클 렌더링 확인 (스크린샷)
  - 위로 문장 정상 표시 확인
  - 한글 문자 keydown 이벤트 디스패치로 실제 타이핑 시뮬레이션 → glow(노란빛) + 파티클 터짐 이펙트가 입력 글자 위치에서 실제로 발생하는 것을 스크린샷으로 확인
  - 오타(알파벳 키 입력) 시 옅은 붉은 밑줄 표시 확인
  - 문장 전체 입력 완료 시 자동으로 다음 문장으로 전환됨을 확인(`TRANSITIONED: true`)
  - 우하단 오디오 컨트롤(음소거 아이콘 + 볼륨 슬라이더) 렌더링 확인
  - 배경 영상/음악 파일이 없는 상태(`public/media/`에 `.gitkeep`만 존재)에서 "배경 영상을 준비 중입니다" 폴백 문구가 화면 하단에 자연스럽게 표시됨을 확인. 관련 404(video/audio 리소스)는 폴백이 정상 트리거되기 위한 예상된 현상.
  - `console --errors` 확인 결과 페이지 렌더링을 막는 JS 에러 없음(404는 리소스 부재로 인한 예상된 네트워크 에러)

### 실제 미디어 파일 연결 후 재검증 (중요 버그 1건 발견 및 수정)
- 저장소에 이전 세션에서 남겨진 실제 로열티 프리 mp3/mp4 샘플이 있어(`public/audio/`, `public/media/` 루트), 사용자 확인 후 `Forest Trees Mystical Sunlight.mp4` → `public/media/video/background.mp4`, `Fireflies.mp3` → `public/media/audio/background.mp3` 로 연결하여 실제 미디어가 있는 상태로 재검증함.
- **[발견 및 수정] 하이드레이션(hydration) 불일치 버그**: `useSentenceTyping`의 초기 상태가 `useState(() => pickNextSentence(...))` 형태로 `Math.random()`을 컴포넌트 최초 렌더링 시점에 호출하고 있었음. Next.js App Router의 `"use client"` 컴포넌트는 서버에서도 1회 렌더링되므로, 서버가 뽑은 랜덤 문장과 클라이언트가 하이드레이션 시 다시 뽑은 랜덤 문장이 달라 `Text content did not match` 하이드레이션 에러가 실제로 발생함(Playwright `console --errors`로 확인). 이는 미디어 파일 유무와 무관하게 실제 배포 환경에서도 항상 재현되는 버그였음.
  - **수정**: 서버/클라이언트 최초 렌더링에서는 항상 `SENTENCES[0]`(고정값)을 표시하도록 변경하고, 마운트 후 `useEffect`에서 랜덤 문장으로 즉시 교체하도록 `src/hooks/useSentenceTyping.ts`를 리팩터링. 수정 후 `tsc --noEmit`/`next build` 재검증 통과, Playwright 재실행 결과 하이드레이션 에러 완전히 사라짐(`console --errors: []`) 확인.
- **[발견 및 수정] 배경 영상 폴백 오탐 버그**: `useBackgroundMedia`가 비디오 준비 완료 판정을 `"playing"` 이벤트 1개에만 의존하고 있어, 실제로 비디오가 재생 가능(`readyState: 4`)한 상태에서도 `"playing"` 이벤트 발생이 지연되면 3초 타임아웃이 먼저 끝나 "배경 영상을 준비 중입니다" 폴백이 잘못 표시됨을 실제 미디어 연결 후 발견(초기 스크린샷에서 재현).
  - **수정**: `video.readyState >= 3`(재생 가능 상태)이면 즉시 ready 처리하고, `"canplay"` 이벤트도 함께 리스닝하도록 `src/hooks/useBackgroundMedia.ts` 보강. 수정 후 재생 중인 배경 영상이 폴백 없이 정상 표시됨을 스크린샷으로 확인.
- 최종 스크린샷에서 다크 필터가 적용된 숲 영상 위에 문장 텍스트가 선명한 대비로 표시되는 것을 확인. 단, 연결한 mp4 샘플 자체에 스톡 사이트 워터마크(반투명 텍스트)가 포함되어 있음 — 개발/테스트 목적으로는 그대로 두었으나, **실제 배포 전 워터마크 없는 정식 라이선스 파일로 반드시 교체 필요** (개선 권고사항에 반영).

### 실사용자 리포트 기반 재검증 — 치명적 버그 발견 및 수정 (한글 입력 자체가 전혀 반영되지 않음)
- 사용자가 실제 브라우저에서 "화면에 위로 문장은 뜨는데 키보드로 타이핑이 전혀 반영되지 않는다(오타 표시조차 없음)"고 리포트함.
- **근본 원인**: 기존 구현이 `window.addEventListener("keydown", ...)`의 `event.key`를 그대로 목표 글자와 `===` 비교하는 방식이었음(당시 `src/lib/typing-judge.ts`, `HealingTypingScreen.tsx`). 그런데 실제 한글 키보드 입력 시 브라우저가 발생시키는 `keydown.key`는 IME 조합 중인 **자모 단위 문자**(예: "ㅁ", "ㅜ")이며, 완성된 음절("무")은 조합이 끝나는 시점에 `compositionend`/`input` 이벤트로만 전달됨. 이전 세션의 Playwright 검증은 완성형 한글 문자를 직접 `KeyboardEvent`로 dispatch하는 방식이라 이 문제를 재현하지 못했음(자모 단위 keydown을 실제로 재현해 검증한 결과 첫 글자부터 항상 오타로 처리되며 진행이 막히는 것을 확인).
- **영향 범위**: PRD 기능 1(위로 문장 따라 쓰기)의 핵심 동작 자체가 실사용 한글 입력에서 사실상 동작하지 않는 치명적 결함이었음. 이전 리뷰에서 "Stage 1: 18/18 PASS"로 판정했던 것은 완성형 문자를 직접 주입하는 방식으로만 검증했기 때문에 발견하지 못한 맹점이었음.
- **수정**: `keydown` 전역 리스너 방식을 폐기하고, 화면에 보이지 않는(1px, opacity 0) `<input>` 엘리먼트를 상시 포커스 상태로 유지한 뒤 `onInput` 이벤트의 `value`(브라우저가 IME 조합을 마친 완성형 문자만 채워줌)를 글자 단위로 순회하며 기존 `handleKeyInput`에 전달하도록 `HealingTypingScreen.tsx`를 리팩터링. 화면 클릭 시 및 blur 시 자동 재포커스 처리. `useSentenceTyping.ts`/`typing-judge.ts`는 변경 없음(인터페이스가 "완성된 글자 1개 판정"이라 그대로 재사용 가능).
- **재검증 결과**: `page.keyboard.type()`(Playwright의 실제 텍스트 입력 경로)으로 문장 29자 전체 입력 → 전량 정상 진행 및 자동 전환 확인. `CompositionEvent`(compositionstart/update/end)를 직접 시뮬레이션한 자모 조합 시나리오에서도 조합 완료 시점에만 정확히 1글자가 `glowing` 상태로 전이됨을 확인. 볼륨 슬라이더 조작 후에도 hidden input 포커스가 정상 복구되어 타이핑이 이어짐을 확인. `tsc --noEmit`/`next build` 재검증 통과, 콘솔 에러 0건.

---

## Stage 1: PRD 일치 검증

### 기능 1: 위로 문장 따라 쓰기

| 수용 기준 | 판정 | 근거 |
|----------|------|------|
| 문장 1개만 표시, 완료 시 1초 이내 자동 전환 | ✅ PASS | `SentenceTypingArea.tsx`는 `currentSentence` 1개만 렌더링. `useSentenceTyping.ts:9` `NEXT_SENTENCE_DELAY_MS = 800` → 마지막 글자 정답 시(`useSentenceTyping.ts:79-86`) `setTimeout(goToNextSentence, 800)` 호출, 1000ms 이내 충족 |
| 20~60자 문장 목록(부록 A), 연속 2회 반복 금지 | ✅ PASS | `src/data/sentences.ts`가 PRD 부록 A 20개 문장(id/text)과 완전히 일치. `src/lib/sentence-utils.ts:6-8` `pickNextSentence`가 `previousSentenceId`를 후보에서 제외 후 랜덤 선택 |
| 오타 시 게임 미종료, 정정 후 진행 지속 | ✅ PASS | `useSentenceTyping.ts:87-96` 오타 시 `cursorIndexRef`를 갱신하지 않고 `isTypo=true`만 설정. 문장/상태 리셋 로직 자체가 존재하지 않음. 정답 입력 시 `isTypo:false`로 정상 전이(62-73행) |
| 타이머/카운트다운/제한시간/순위/게임오버 부재 | ✅ PASS | `grep -i "타이머\|카운트다운\|제한시간\|순위\|게임오버\|timer\|countdown\|score\|gameOver\|ranking"` 결과 `src/` 전체에서 관련 코드 0건(`lastTimeRef`는 rAF delta 계산용 변수로 무관) |
| 진행 상태 미저장에도 오류 없음 | ✅ PASS | `grep "localStorage\|sessionStorage"` 결과 0건. 전체 상태가 `useState`/`useRef` 메모리 상태로만 관리(`useSentenceTyping.ts`) |
| 문장 소진 시 순환(끊기지 않음) | ✅ PASS | `pickNextSentence`는 매 호출 시 `SENTENCES` 전체(20개)에서 직전 문장만 제외하고 재선택하므로 소진 개념 자체가 없고 무한히 순환 제공됨 |

**기능 1 종합: 6/6 PASS**

### 기능 2: 타이핑 반짝임·빛 파티클·페이드아웃 이펙트

| 수용 기준 | 판정 | 근거 |
|----------|------|------|
| 정답 입력 시 0.3초 내외 glow 채움 애니메이션 | ✅ PASS | `tailwind.config.ts:11-29` `glow-in` keyframe 300ms(`animation: "glow-in 300ms ease-out"`), `TypingChar.tsx:13` `glowing: "text-white animate-glow-in"`, `particle-utils.ts:1` `GLOW_DURATION_MS = 300`과 일치 |
| 글자 위치에서 파티클 사방 확산 후 1초 이내 소멸 | ✅ PASS | `TypingChar.tsx:22-28`에서 `glowing` 진입 시 `getBoundingClientRect()` 좌표로 `onGlowStart(x,y)` 호출 → `SentenceTypingArea.tsx:21-23` `handleGlowStart` → `CharParticleCanvas`의 `spawnAt` 실행(죽은 코드 아님, 실제 연결 확인). `particle-utils.ts:7` `PARTICLE_LIFE_MS = 900`(<1000ms), `updateParticle`이 `life`를 감쇠시켜 소멸 |
| settled 글자 일정 시간 후 fade out, 판정엔 영향 없음 | ✅ PASS | `useCharEffects.ts:45-63`에서 `glowing→settled(4.5s 유지)→fading→gone` 전이를 별도 rAF 루프로 처리. 판정은 `useSentenceTyping`의 `cursorIndexRef`/`correctIndex` 개념(인덱스 기반)만으로 이루어지며 시각 상태(`CharStatus`)를 전혀 참조하지 않음 — 구조적으로 분리되어 있어 `gone` 이후에도 완료 판정에 영향 없음 |
| 오타 표시가 비자극적 방식 | ✅ PASS | `TypingChar.tsx:33-35` `isTypo`일 때 `border-b-2 border-red-400/50`만 추가(옅은 붉은 밑줄). 배경색 변경, 흔들림 애니메이션, 사운드 등 자극적 연출 코드 없음 |
| 빠른 연속 타이핑에도 이펙트 밀림/겹침 없음 | ✅ PASS | `particle-utils.ts` 고정 크기 배열(`PARTICLE_POOL_SIZE=300`)을 `createParticlePool`로 미리 할당, `spawnParticlesInPool`이 `cursor.index % pool.length`로 순환 재사용(객체 풀링). `push`/`filter` 등 매 프레임 배열 재생성 없음 |
| 저사양 환경 이펙트 실패 시 입력 판정 무영향 | ✅ PASS | `useParticleSystem.ts:32-41`, `StarfieldBackground.tsx:36-45` 모두 `getContext("2d")` 실패 시 `console.warn` 후 `return`(렌더링만 스킵). 판정 로직(`useSentenceTyping`)은 이 훅들을 전혀 참조하지 않는 완전 독립 구조이므로 Canvas 실패가 입력 진행에 영향 불가 |

**기능 2 종합: 6/6 PASS** — 이펙트 로직이 실제로 호출 체인에 연결되어 있음을 직접 추적 확인(죽은 코드 없음).

### 기능 3: 다크 무드 배경 + 로컬 영상·음악 재생

| 수용 기준 | 판정 | 근거 |
|----------|------|------|
| 다크 톤 배경 + 크기/밝기 다른 빛 요소가 항상 떠다님 | ✅ PASS | `StarfieldBackground.tsx:15-27` `STAR_COUNT=90`, `size`/`baseAlpha` 랜덤화, `driftX/driftY` + `twinklePhase` 기반 부유·반짝임. `HealingTypingScreen.tsx:37`에서 비디오 상태와 무관하게 항상 렌더링 |
| 배경 영상 3초 이내 재생 시작 + 자동 반복 재생 | ✅ PASS | `useBackgroundMedia.ts:31` `VIDEO_READY_TIMEOUT_MS=3000` 타이머, `playing` 이벤트 발생 시 `ready`. `BackgroundVideoLayer.tsx:21-23` `<video loop autoPlay muted playsInline>` |
| 배경 음악 자동 재생 + 음소거/음량 조절 UI | ✅ PASS | `AudioController.tsx`에 음소거 버튼(`toggleMute`)·볼륨 슬라이더(`setVolume`) 존재, `<audio loop>` + 다중 `<source>`(mp3/wav) 구성. `useAudioControls` 이중 호출 문제는 수정 완료(Stage 3 참고) — `isMuted`/`volume`은 `AudioController` 단일 소스로 관리, `HealingTypingScreen`은 순수 함수 `attemptAutoplay`만 사용 |
| 미디어 부재/로드 실패 시 다크 배경+안내 문구로 대체 | ✅ PASS | `BackgroundVideoLayer.tsx:26` `videoStatus === "error"`일 때 `FallbackNotice` 렌더링(`FallbackNotice.tsx:5` "배경 영상을 준비 중입니다"). `public/media/video/`, `public/media/audio/`에는 실제 파일 없이 `.gitkeep`만 존재하는 상태에서 폴백이 정상 트리거되는 구조 확인 |
| 배경과 텍스트가 항상 뚜렷하게 구분되는 대비 | ✅ PASS | `HealingTypingScreen.tsx:39` `bg-black/50` 오버레이, `SentenceTypingArea.tsx:31` `drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]` + `text-white` 계열 고정 색상 |
| 미디어 로드 지연/실패가 기능 1·2에 영향 없음 | ✅ PASS | `useBackgroundMedia`, `useAudioControls`는 `useSentenceTyping`, `useCharEffects`와 어떤 상태도 공유하지 않음(임포트 관계 없음). `HealingTypingScreen.tsx`에서 각각 독립 호출 후 병렬로 하위 전달 |

**기능 3 종합: 5/6 PASS, 1/6 PASS(경고 동반)**

### PRD 수용 기준 종합: 18/18 완전 PASS

---

## Stage 2: TECH_SPEC 일치 검증

### 파일 구조

| TECH_SPEC 명세 | 실제 파일 | 판정 |
|---------------|----------|------|
| src/app/layout.tsx, page.tsx, globals.css | 전부 존재 | ✅ |
| src/components/typing/{HealingTypingScreen,SentenceTypingArea,TypingChar,CharParticleCanvas}.tsx | 전부 존재 | ✅ |
| src/components/background/{StarfieldBackground,BackgroundVideoLayer,FallbackNotice}.tsx | 전부 존재 | ✅ |
| src/components/audio/AudioController.tsx | 존재 | ✅ |
| src/hooks/{useSentenceTyping,useCharEffects,useParticleSystem,useBackgroundMedia,useAudioControls}.ts | 전부 존재 | ✅ |
| src/data/sentences.ts | 존재, 20개 문장 전량 | ✅ |
| src/types/{typing,sentence,media}.ts | 전부 존재 | ✅ |
| src/lib/{sentence-utils,typing-judge,particle-utils}.ts | 전부 존재 | ✅ |
| public/media/video/background.mp4, public/media/audio/background.mp3 | 폴더만 존재(`.gitkeep`), 실 파일 미배치 | ✅ (Phase 4-15 의도된 상태, 폴백 검증 우선 단계) |
| 스펙 외 추가 파일 여부 | `src/lib/media-paths.ts` 1개 추가 | ✅ (TECH_SPEC 6.1절에서 이미 예고된 파일, 감점 대상 아님) |

**파일 구조: 전량 일치, 누락/무단 추가 없음.**

참고: 프로젝트 루트에 `src_old_20260719/`, `claudedocs_old_20260719/`, `public/audio/*.wav`, `public/*.mp4`(루트) 등 이전 스코프(Pexels/테마) 잔재가 존재하나, `tsconfig.json:26`에서 `src_old_20260719`를 `exclude`하고 있고 `public/audio/*`, 루트 `*.mp4`는 `MEDIA_PATHS`(`/media/video/background.mp4`, `/media/audio/background.mp3`)에서 전혀 참조되지 않아 런타임에 영향이 없습니다. 다만 저장소 정리 관점에서는 삭제 대상입니다(Stage 3 개선 권고 참고).

### 함수/인터페이스

| TECH_SPEC 명세 | 실제 구현 | 판정 |
|---------------|----------|------|
| `CharStatus`, `CharState`, `SentenceTypingState` | `src/types/typing.ts` 전량 일치(단, `SentenceTypingState`는 정의되어 있으나 `useSentenceTyping`이 이 타입을 직접 사용하지 않고 개별 필드로 관리 — 기능상 문제 없음) | ✅ |
| `SentenceItem` | `src/types/sentence.ts` 일치 | ✅ |
| `MediaLoadStatus`, `UseBackgroundMediaReturn` | `src/types/media.ts` 일치 | ✅ |
| `pickNextSentence` | `src/lib/sentence-utils.ts` 시그니처/로직 일치 | ✅ |
| `useSentenceTyping` (완료 감지 + ≤1000ms 전환) | `src/hooks/useSentenceTyping.ts`, 800ms로 구현 | ✅ |
| `useCharEffects` (상태머신 rAF 스케줄링) | `src/hooks/useCharEffects.ts`, 단일 rAF 루프로 구현 | ✅ |
| `useParticleSystem` (`spawnAt`, 객체 풀) | `src/hooks/useParticleSystem.ts` 일치 | ✅ |
| `MEDIA_PATHS` 상수 | `src/lib/media-paths.ts` 경로/구조 정확히 일치 | ✅ |
| `useBackgroundMedia` (3초 타이머, onError) | `src/hooks/useBackgroundMedia.ts` 일치 | ✅ |
| `useAudioControls` | `src/hooks/useAudioControls.ts` — 수정 완료. `AudioController.tsx` 1곳에서만 상태 훅 호출, `attemptAutoplay`는 순수 함수로 분리해 `HealingTypingScreen`에서 import | ✅ |

### API 엔드포인트
해당 없음(TECH_SPEC 자체가 API Route 없음을 명시, `grep "fetch\(|process.env"` 결과 0건으로 일치 확인).

**Stage 2 종합: 파일/함수/타입 구조 전량 스펙과 일치. `useAudioControls` 호출 방식 이슈도 수정 완료.**

**Stage 2 종합: 파일/함수/타입 구조는 전량 스펙과 일치. 유일한 이슈는 `useAudioControls` 호출 방식(설계 의도 대비 실제 구현의 미세한 이탈).**

---

## Stage 3: 코드 품질 검증

| 항목 | 판정 | 비고 |
|------|------|------|
| TypeScript 타입 안전성 | ✅ PASS | `any` 사용 0건 확인(전체 소스 정독). `strict: true` 환경에서 옵셔널 체이닝(`?.`), 널 가드(`if (!video) return`) 일관 적용 |
| 에러 처리 | ✅ PASS | `useParticleSystem.ts:33-37`, `StarfieldBackground.tsx:37-41` Canvas 컨텍스트 획득 실패 시 try/catch + graceful degradation. `useAudioControls.ts:38` `play().catch()`로 `NotAllowedError` 흡수 |
| 접근성 (a11y) | ✅ PASS | `SentenceTypingArea.tsx:28-29` `role="group" aria-label`, `AudioController.tsx` `aria-label`/`aria-pressed`, 장식용 Canvas/video에 `aria-hidden="true"` 일관 적용 |
| 하드코딩 여부 | ✅ PASS | glow/settled/fade 지속시간, 파티클 풀 크기 등이 `particle-utils.ts` 상수로 분리. 매직 넘버 최소화 |
| 컴포넌트 단일 책임 / 구조 결함 | ✅ PASS | `useAudioControls` 이중 호출 수정 완료(아래 상세) |

### 불일치 항목 상세 (모두 수정 완료)

#### 1. [수정 완료] `useAudioControls` 훅 이중 호출로 인한 상태 이중화 (우선순위: 중간)
- **스펙**: TECH_SPEC 4.8절 "`AudioController.tsx` — ... 음소거 토글 버튼 + 볼륨 슬라이더 UI 제공", 6.2절 "격리 원칙: `useBackgroundMedia`, `useAudioControls`는 `useSentenceTyping`, `useCharEffects`와 상태를 공유하지 않는 완전히 독립된 훅으로 설계"— 훅 자체는 단일 상태 소스로 사용되는 것을 전제로 설계됨.
- **당시 실제**: `src/components/typing/HealingTypingScreen.tsx:15` `const { attemptAutoplay } = useAudioControls(audioRef);`와 `src/components/audio/AudioController.tsx:13` `const { isMuted, volume, toggleMute, setVolume } = useAudioControls(audioRef);`가 **동일한 `audioRef`에 대해 별도의 훅 인스턴스를 각각 생성**하여 `isMuted`/`volume`이 두 컴포넌트 트리에서 별도로 관리되던 구조적 결함.
- **수정 내용**: `attemptAutoplay`를 훅 상태와 무관한 순수 함수로 분리해 `src/hooks/useAudioControls.ts`에서 `export const attemptAutoplay = (...)`로 직접 export. `useAudioControls(audioRef)`(상태 훅)는 이제 `AudioController.tsx` 1곳에서만 호출되어 `isMuted`/`volume`의 단일 소스가 됨. `HealingTypingScreen.tsx`는 `import { attemptAutoplay } from "@/hooks/useAudioControls"`로 순수 함수만 사용. 수정 후 `npx tsc --noEmit`, `npm run build` 재실행하여 통과 확인.

#### 2. 한글 IME 조합 처리 부재 (우선순위: 낮음~중간, PRD 명시 기준 아님)
- **스펙**: PRD 기능 1 수용 기준에 IME 관련 명시적 언급은 없음. 다만 "화면에 뜨는 위로의 문장을 내 속도로 따라 입력"이라는 핵심 사용자 스토리와 "100ms 이내 반영" 비기능 요구가 한글 입력의 정상 동작을 전제로 함.
- **실제**: `HealingTypingScreen.tsx:25-29`에서 `window.addEventListener("keydown", ...)`의 `event.key`(길이 1 문자)만으로 판정하며, `compositionstart`/`compositionend` 처리가 `src/` 전체에 0건(`grep` 확인).
- **차이**: 대부분의 최신 브라우저(Chrome/Edge 등)는 한글 조합 중에도 `keydown.key`에 완성된 글자 또는 중간 자모를 실시간 반영하므로 실사용상 크게 문제되지 않을 가능성이 높으나, 브라우저/IME 환경에 따라 조합 완료 전 자모 단위 keydown이 여러 번 발생하거나 마지막 글자가 두 번 카운트되는 등의 엣지 케이스가 발생할 수 있음. PRD 수용 기준 위반으로 단정할 근거는 없어 Stage 1 FAIL 처리하지 않았음.
- **추가 검증(메인 세션)**: Playwright로 완성된 한글 문자를 `keydown` 이벤트로 디스패치해 실제 문장 전체를 입력하는 시나리오를 구동한 결과, 오타 판정·자동 전환·이펙트 모두 정상 동작 확인. 다만 이는 이미 조합 완료된 문자를 이벤트로 주입한 것이라 실제 IME 자모 조합 과정(자판에서 직접 타이핑 시 발생하는 `compositionstart/update/end`)까지 검증한 것은 아니므로, 실제 키보드로 빠르게 연타할 때의 엣지 케이스는 여전히 미검증 상태.
- **개선 제안**: 실사용자 환경(실제 키보드, 다양한 OS/브라우저 IME)에서 빠른 연속 한글 입력을 수동 테스트하고, 문제 발생 시 `hidden <input>` + `onCompositionEnd` 기반으로 전환 권고(TECH_SPEC 5.5절도 "onKeyDown 또는 hidden `<input>`의 onChange" 둘 다 허용하고 있어 스펙 위반은 아님).

#### 3. 저장소 내 이전 스코프 잔재 파일 정리 미흡 (우선순위: 낮음)
- **스펙**: TECH_SPEC 1.1절 "제거: ... Pexels 관련 타입/데이터, ThemeSelector/ModeSelector, FallingWordsMode, useFallingWords, useTheme, 테마별 JSON — 생성하지 않는다."
- **실제**: `src/`(신규) 자체에는 해당 요소가 전혀 없어 스펙을 충족하나, 저장소 루트에 `src_old_20260719/`(Pexels/테마 코드 포함), `claudedocs_old_20260719/`, `public/audio/*.wav`, 루트 `public/*.mp4` 등 이전 파일이 그대로 남아있음. `tsconfig.json`에서 `src_old_20260719`가 명시적으로 `exclude`되어 빌드/타입체크에는 영향 없음을 확인.
- **차이**: 기능적 결함은 아니나 "생성하지 않는다"는 스펙의 취지(저장소 청결성)와 다소 어긋나며, 향후 유지보수 시 혼동 소지.
- **개선 제안**: 배포 전 `src_old_20260719/`, `claudedocs_old_20260719/`, `public/audio/*.wav`, 루트 `public/*.mp4` 삭제 또는 저장소 밖(백업)으로 이동 권고. 기능 동작에는 영향 없으므로 우선순위 낮음.

---

## 개선 권고사항

### 우선순위 높음 (PRD 불일치)
없음 — PRD 수용 기준 18개 전량 실질적으로 충족.

### 우선순위 중간 (TECH_SPEC 불일치 / 구조 결함)
1. ~~`useAudioControls` 이중 호출 제거~~ → **수정 완료.**
2. 한글 IME 연속 입력 시나리오 실제 키보드로 수동 검증(Chrome/Safari/Firefox), 필요 시 `compositionend` 기반 처리로 보강 — 남은 항목(자동화 검증으로는 완전히 대체 불가, 실사용자 조치 필요).
3. ~~배포/커밋 전 `npm run typecheck`~~ → **수정 완료** (메인 세션에서 `tsc --noEmit`/`next build` 실제 실행, 에러 0건).
4. ~~하이드레이션 불일치 버그(랜덤 문장 초기값)~~ → **수정 완료** (`useSentenceTyping.ts`, 실제 배포 환경에서 항상 재현되던 버그였음 — 상세는 위 "실제 미디어 파일 연결 후 재검증" 참고).
5. ~~배경 영상 폴백 오탐 버그(`playing` 이벤트 단독 의존)~~ → **수정 완료** (`useBackgroundMedia.ts`).

### 우선순위 낮음 (품질 개선)
1. 저장소 내 이전 스코프 잔재(`src_old_20260719/`, `claudedocs_old_20260719/`, `public/audio/*.wav` 원본, `public/media/` 루트의 미사용 mp4 5종) 정리 — 실사용 파일은 `public/media/video/background.mp4`, `public/media/audio/background.mp3`로 이미 복사 완료.
2. `src/types/typing.ts`의 `SentenceTypingState` 타입이 정의만 되어 있고 `useSentenceTyping`에서 해당 타입으로 상태를 묶어 관리하지 않는 점 — 기능상 문제는 없으나 타입과 실제 구현 형태를 일치시키면 가독성 향상.
3. **[배포 전 필수]** 현재 연결된 `public/media/video/background.mp4`("Forest Trees Mystical Sunlight")에 스톡 사이트 워터마크가 화면 중앙에 노출됨. 개발/테스트 목적으로는 무방하나, 실제 배포 전 워터마크 없는 정식 라이선스 영상으로 교체 필요.

---

## 잘 구현된 부분 (긍정 피드백)
- 판정 로직(`useSentenceTyping`)과 이펙트 로직(`useCharEffects`, `useParticleSystem`)이 상태를 전혀 공유하지 않는 완전 독립 구조로 구현되어, TECH_SPEC이 강조한 "이펙트 실패가 판정에 영향 없음" 원칙이 코드 구조 수준에서 실제로 보장됨.
- 파티클 시스템이 매 프레임 배열을 재생성하지 않는 고정 크기 객체 풀 방식으로 구현되어 GC 압박 최소화 설계 의도가 정확히 반영됨.
- 미디어 폴백 로직(3초 타이머 + onError + FallbackNotice)이 실제로 배치되지 않은 파일 상태에서도 정상 동작하도록 구조화되어 있고, `useBackgroundMedia`/`useAudioControls`가 타이핑 훅과 완전히 독립되어 있어 기능 간 격리 원칙이 잘 지켜짐.
- 타이머/카운트다운/순위/게임오버/외부 API 관련 코드가 전무하여 PRD의 "경쟁 요소 완전 배제" 핵심 가치가 코드 수준에서 정확히 구현됨.
