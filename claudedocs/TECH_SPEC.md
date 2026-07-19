# TECH_SPEC: 위로의 문장 (Healing Sentence Typing)

> PRD 참조: claudedocs/PRD.md
> PRD 기능 3개(위로 문장 따라 쓰기 / 타이핑 반짝임·빛 파티클·페이드아웃 이펙트 / 다크 무드 배경 + 로컬 영상·음악 재생), 수용 기준 18개(부록 A 문장 세트 포함) 전량 매핑
> 본 프로젝트는 이전 "힐링 타자게임(떨어지는 단어 + 테마 선택 + Pexels API)" 스코프를 계승하지 않는다. 단일 모드(고정 문장 타이핑) + 로컬 미디어 전용으로 새로 설계하며, Pexels/외부 API, 테마 선택기, 단어 낙하 모드는 설계에서 완전히 배제한다.

---

## 1. 기술 스택

이 프로젝트는 이미 세팅되어 있는 Next.js 프로젝트를 재사용한다 (`package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js` 확인 완료). 신규 의존성 추가는 최소화한다.

| 구분 | 기술 | 버전(현재 설치) | 선정 근거 |
|------|------|------|----------|
| Framework | Next.js (App Router) | 14.2.35 (기존 재사용) | 이미 프로젝트에 세팅됨. 서버 API/외부 API가 전혀 필요 없는 순수 클라이언트 경험이므로 App Router의 클라이언트 컴포넌트(`"use client"`)만으로 충분. 별도 API Route 불필요. |
| Language | TypeScript | ^5.5.2 (기존 재사용) | 글자 상태머신(5개 상태), 문장 데이터, 오디오/비디오 상태 등 도메인 모델의 타입 안전성 확보. strict 모드 이미 활성화(`tsconfig.json`). |
| Styling | Tailwind CSS | ^3.4.4 (기존 재사용) | 다크 배경 오버레이, 텍스트 대비, 레이아웃 전반을 유틸리티 클래스로 신속 구성. `tailwind.config.ts`에 이미 `glow-in` 키프레임이 정의되어 있어 이를 그대로 확장해 사용. |
| 상태 관리 | React hooks (useState/useReducer/useRef) | - | 화면이 사실상 1개(타이핑 화면)이고 전역 상태가 "현재 문장 + 글자별 상태 + 오디오 볼륨" 정도로 단순. Redux/Zustand 등 추가 라이브러리 도입은 오버엔지니어링. |
| 타이핑 이펙트 렌더링 | CSS Animation/Transition(글자 자체) + Canvas 2D(빛 파티클) 하이브리드 | - | 아래 "2.1 타이핑 이펙트 구현 방식 결정"에서 상세 근거 설명. |
| 미디어 재생 | HTML5 `<video>` / `<audio>` (네이티브 API) | - | 로컬 정적 파일 재생에는 네이티브 엘리먼트로 충분. 별도 플레이어 라이브러리(video.js 등) 불필요. |
| 데이터 저장 | 없음 (메모리 상태만) | - | PRD 수용 기준에 "이전 진행 상태가 저장되지 않아도 오류 없음"이 명시되어 있어 localStorage 등 영속 저장소를 의도적으로 배제. 세션 내 메모리 상태로 충분. |
| 배포 환경 | Vercel (또는 정적 호스팅 가능한 환경) | - | 서버 API/환경변수/시크릿이 전혀 없으므로 사실상 정적 사이트에 가까움. Next.js와의 기존 통합을 그대로 유지. |

### 1.1 기존 프로젝트 대비 변경/제거 사항
- 제거: `/api/background-video` 및 유사 API Route, `src/lib/pexels.ts`, Pexels 관련 타입/데이터, `ThemeSelector`/`ModeSelector`, `FallingWordsMode`, `useFallingWords`, `useTheme`, 테마별(ocean/forest/sunset) JSON — 이번 PRD 스코프에 전혀 등장하지 않으므로 생성하지 않는다.
- 유지: Next.js/React/TypeScript/Tailwind 기본 세팅, `tailwind.config.ts`의 `glow-in` 키프레임(그대로 재사용 및 확장).
- 신규: 단일 문장 타이핑 엔진, 글자별 상태머신 기반 이펙트 레이어, 로컬 미디어 배경 레이어(폴백 로직 포함).

---

## 2. 전체 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│                     app/page.tsx                         │
│              (HealingTypingScreen 진입점)                 │
├─────────────────────────────────────────────────────────┤
│ Layer 0 (최하단): StarfieldBackground                     │
│   - Canvas 2D, 떠다니는 빛/파티클(별빛) 애니메이션           │
│                                                            │
│ Layer 1: BackgroundVideoLayer                             │
│   - <video> 로컬 mp4, mix-blend-mode로 다크톤 유지          │
│   - 파일 없음/로드 실패 시 폴백 문구 표시                     │
│                                                            │
│ Layer 2: 다크 오버레이 (bg-black/50 등, 텍스트 대비 확보)     │
│                                                            │
│ Layer 3: SentenceTypingArea (핵심 UI, 중앙 배치)            │
│   - 현재 문장 표시 + 글자별 상태(미입력/glow/파티클/          │
│     페이드아웃/사라짐) 렌더링                                │
│   - CharParticleCanvas (글자 위치 기준 파티클, Layer 3.5)    │
│                                                            │
│ Layer 4: AudioController (화면 우하단 등 고정 UI)            │
│   - 음소거/볼륨 슬라이더, <audio> 엘리먼트 제어               │
└─────────────────────────────────────────────────────────┘

입력 흐름:
[keydown/onChange] → useSentenceTyping (판정) → CharState[] 갱신
                                              → useCharEffects (상태머신 스케줄링)
                                              → CharParticleCanvas에 파티클 스폰 이벤트 push
                                              → 문장 완료 시 nextSentence() 호출 (1초 이내 전환)
```

### 2.1 타이핑 이펙트 구현 방식 결정 (핵심 기술 판단)

**검토한 3가지 옵션:**

1. **순수 CSS Animation/Transition만 사용** (글자+파티클 전부 DOM+CSS)
   - 장점: 구현 단순, 브라우저 GPU 합성(transform/opacity) 활용 가능.
   - 단점: "사방으로 흩어지는 빛 파티클"을 자연스럽게 구현하려면 파티클마다 별도 DOM 엘리먼트(예: 8~12개/글자)가 필요. 빠른 연속 타이핑 시(초당 5~10글자) DOM 노드가 순간적으로 수십~백여 개까지 생성/제거되며, 이는 리플로우/리페인트 비용과 GC 압박을 유발해 PRD의 "빠른 연속 타이핑에도 밀리지 않음", "60fps" 요구를 위협할 수 있음.

2. **Canvas/WebGL 풀 파티클 시스템** (글자 렌더링까지 전부 Canvas)
   - 장점: 대량 파티클 처리에 최적.
   - 단점: 한글 텍스트 렌더링(줄바꿈, IME 조합 중인 글자 표시, 접근성/텍스트 선택 등)을 Canvas로 직접 구현하면 복잡도가 크게 증가하고, 텍스트 자체의 가독성/접근성(스크린리더, 대비 등) 요구를 만족시키기 어려움. MVP 규모 대비 과도한 엔지니어링.

3. **하이브리드 (채택): 글자 자체는 DOM + CSS Animation, 파티클만 단일 Canvas 2D 레이어**
   - 글자(`span`)는 실제 텍스트 노드로 유지 → 접근성, 선택, 줄바꿈, 오타 표시(밑줄) 모두 표준 CSS로 간단히 처리. `tailwind.config.ts`에 이미 있는 `glow-in` keyframe을 그대로 재사용/확장.
   - 파티클(글자당 6~10개, 사방으로 흩어졌다 사라짐)은 **단일 `<canvas>` 위에서 `requestAnimationFrame` 기반 커스텀 파티클 시스템**으로 처리. 파티클 배열을 객체 풀(pool)로 재사용하여 매 프레임 GC 압박 없이 update/draw. 글자 수만큼 DOM이 늘어나지 않으므로 빠른 연속 입력에도 안정적.
   - **결론 근거**: PRD 비기능 요구사항의 "60fps", "빠른 연속 타이핑에도 밀리지 않음", "저사양 환경에서 이펙트가 실패해도 입력 판정에는 영향 없음"을 모두 만족시키면서, 한글 텍스트 처리의 단순성(DOM 기반 글자)을 유지하는 절충점. 파티클 렌더링 실패(Canvas 컨텍스트 획득 실패 등)가 발생해도 글자 상태머신(판정 로직)과는 완전히 분리되어 있어 입력 진행에 영향을 주지 않음(수용 기준 충족).

---

## 3. 프로젝트 구조 (전체 파일 트리)

```
src/
├── app/
│   ├── layout.tsx                   # 루트 레이아웃 (폰트, 메타데이터, globals.css 적용)
│   ├── page.tsx                     # 메인 페이지 — <HealingTypingScreen /> 렌더링만 담당
│   └── globals.css                  # Tailwind 지시자 + 전역 다크 배경 기본값, 커스텀 keyframe 보강
│
├── components/
│   ├── typing/
│   │   ├── HealingTypingScreen.tsx  # 전체 화면 컨테이너. 배경 레이어 + 타이핑 영역 + 오디오 컨트롤 조합 (기능 1,2,3 오케스트레이션)
│   │   ├── SentenceTypingArea.tsx   # 현재 문장 표시, 글자별 span 렌더링 (기능 1, 기능 2)
│   │   ├── TypingChar.tsx           # 글자 1개 렌더링 담당, CharState에 따른 CSS 클래스 분기 (기능 2)
│   │   └── CharParticleCanvas.tsx   # 파티클 전용 Canvas 2D 레이어, 스폰 이벤트 큐 구독 (기능 2)
│   ├── background/
│   │   ├── StarfieldBackground.tsx  # 떠다니는 빛/별 파티클 배경(Canvas 2D 또는 CSS, 아래 4장 참고) (기능 3)
│   │   ├── BackgroundVideoLayer.tsx # 로컬 mp4 재생 + onError 폴백 처리 (기능 3)
│   │   └── FallbackNotice.tsx       # "배경 영상을 준비 중입니다" 등 안내 문구 컴포넌트 (기능 3)
│   └── audio/
│       └── AudioController.tsx      # 로컬 오디오 재생, 음소거/볼륨 UI + onError 폴백 (기능 3)
│
├── hooks/
│   ├── useSentenceTyping.ts         # 문장 진행/입력 판정/문장 전환 로직 (기능 1)
│   ├── useCharEffects.ts            # 글자별 상태머신(미입력→glow→파티클→페이드아웃→사라짐) 스케줄링 (기능 2)
│   ├── useParticleSystem.ts         # requestAnimationFrame 기반 파티클 풀 관리 (기능 2)
│   ├── useBackgroundMedia.ts        # 비디오/오디오 파일 존재 여부·로드 상태 관리, onError 감지 (기능 3)
│   └── useAudioControls.ts          # 음소거/볼륨 상태 및 <audio> ref 제어 (기능 3)
│
├── data/
│   └── sentences.ts                 # 부록 A 문장 목록 (SentenceItem[] 타입, 20개)
│
├── types/
│   ├── typing.ts                    # CharState, CharSnapshot 등 타이핑 도메인 타입 (기능 1, 2)
│   ├── sentence.ts                  # SentenceItem 타입 (기능 1)
│   └── media.ts                     # MediaLoadStatus 등 미디어 도메인 타입 (기능 3)
│
└── lib/
    ├── sentence-utils.ts            # 문장 랜덤 선택(직전 문장 연속 방지), 순환 로직 (기능 1)
    ├── typing-judge.ts              # 글자 단위 정확/오타 판정 순수 함수 (기능 1, 2)
    └── particle-utils.ts            # 파티클 생성/물리(속도, 감쇠, 수명) 순수 함수 (기능 2)

public/
└── media/
    ├── video/
    │   └── background.mp4           # 사용자가 직접 배치할 로컬 배경 영상 (파일명 고정)
    └── audio/
        └── background.mp3           # 사용자가 직접 배치할 로컬 배경 음악 (파일명 고정, wav도 허용)
```

### 3.1 폴더 설계 근거
- 이전 프로젝트의 `components/game`, `components/background`, `components/theme` 3분할 관례를 계승하되, 테마 개념이 사라졌으므로 `theme/` 디렉토리는 만들지 않고 `typing/`(문장+이펙트) / `background/`(배경 영상+별빛) / `audio/`(음악) 3영역으로 재구성.
- `hooks/`는 "판정 로직(useSentenceTyping)"과 "이펙트 스케줄링(useCharEffects, useParticleSystem)"을 분리하여, 이펙트가 실패하더라도 판정 로직에 영향이 없다는 설계 원칙(수용 기준)을 코드 구조로도 드러냄.
- `data/sentences.ts`는 이전 프로젝트의 `data/content/*.json` 다중 테마 파일 구조 대신 단일 파일로 단순화(테마 없음).

---

## 4. 컴포넌트별 책임

### 4.1 `HealingTypingScreen.tsx` (오케스트레이션)
- 배경 레이어(`StarfieldBackground` → `BackgroundVideoLayer`) → 오버레이 → `SentenceTypingArea` → `AudioController` 순서로 z-index를 쌓아 렌더링.
- 문장 상태(`useSentenceTyping`)와 미디어 상태(`useBackgroundMedia`, `useAudioControls`)를 최상위에서 각각 독립적으로 호출해 하위로 전달. 두 상태 트리는 서로를 구독하지 않음(기능 3의 "미디어 실패가 기능 1/2에 영향 없음" 요건을 구조적으로 보장).

```typescript
export default function HealingTypingScreen(): JSX.Element {
  // useSentenceTyping() — 문장/글자 판정 상태
  // useBackgroundMedia() — 비디오/오디오 파일 로드 상태 (독립)
  // useAudioControls() — 볼륨/음소거 (독립)
  // 렌더링만 담당, 비즈니스 로직은 각 훅에 위임
}
```

### 4.2 `SentenceTypingArea.tsx`
- `useSentenceTyping`이 제공하는 `currentSentence: string`, `charStates: CharState[]`를 받아 `TypingChar` 목록을 렌더링.
- 문장 완료 감지 시(모든 글자 `CharStatus === 'correct'` 이상 상태) 1초 이내 자동 전환은 `useSentenceTyping` 내부에서 `setTimeout(1000ms 이하)`로 트리거하고, 이 컴포넌트는 단순히 최신 문장을 반영만 함.

```typescript
interface SentenceTypingAreaProps {
  sentence: string;
  charStates: CharState[];
}
function SentenceTypingArea(props: SentenceTypingAreaProps): JSX.Element { /* ... */ }
```

### 4.3 `TypingChar.tsx`
- 글자 하나(`CharState`)를 입력받아 상태별 Tailwind 클래스를 분기 렌더링. 상태머신은 5장에서 상세 정의.

```typescript
interface TypingCharProps {
  char: string;
  state: CharState["status"]; // 'pending' | 'glowing' | 'settled' | 'fading' | 'gone'
  isTypo: boolean; // 오타 밑줄 표시 여부 (독립적 플래그, settled와 별개로 순간 표시 후 해제)
}
function TypingChar(props: TypingCharProps): JSX.Element { /* ... */ }
```

### 4.4 `CharParticleCanvas.tsx`
- 화면 전체(또는 문장 영역)를 덮는 단일 `<canvas>`. `useParticleSystem`이 관리하는 파티클 배열을 매 프레임 `draw()`.
- 글자가 `glowing` 상태로 진입하는 순간, 해당 글자 DOM 엘리먼트의 `getBoundingClientRect()` 좌표를 기준으로 파티클 스폰 이벤트를 `useParticleSystem.spawnAt(x, y)`에 전달.
- Canvas 컨텍스트 획득 실패(구형 브라우저 등) 시 렌더링을 조용히 스킵하고 콘솔 경고만 남김 — 타이핑 판정에는 영향 없음.

```typescript
interface CharParticleCanvasProps {
  className?: string;
}
// 내부적으로 useParticleSystem()을 호출해 particles 배열을 매 프레임 그림
function CharParticleCanvas(props: CharParticleCanvasProps): JSX.Element { /* ... */ }
```

### 4.5 `StarfieldBackground.tsx`
- 다크 배경 위에 크기/밝기가 다른 점 형태의 빛이 천천히 부유하는 애니메이션. Canvas 2D 기반(파티클 시스템과 동일 기법, 별도의 저비용 인스턴스로 분리 — 문장 파티클과 스폰/수명 로직을 공유하지 않도록 독립 모듈화하여 서로 성능 영향 최소화).
- 항상 최하단(z-0)에 위치, 배경 영상 로드 여부와 무관하게 항상 렌더링(영상이 없을 때 유일한 배경 역할도 겸함 = 기능 3의 폴백 요건 충족).

### 4.6 `BackgroundVideoLayer.tsx`
- `public/media/video/background.mp4`를 `<video muted loop playsInline autoPlay>`로 재생.
- `onError`, 그리고 일정 시간(3초) 내 `onPlaying` 이벤트 미발생 시 `useBackgroundMedia`의 상태를 `'error'`로 전환, 이 컴포넌트는 비디오 엘리먼트를 언마운트하고 `FallbackNotice`만 남김.
- `mix-blend-mode: luminosity` 또는 `brightness(0.6) saturate(0.8)` 필터 + 다크 오버레이(`bg-black/50`)를 적용해 밝은 영상이 들어와도 다크 무드가 유지되도록 처리.

### 4.7 `FallbackNotice.tsx`
- "배경 영상을 준비 중입니다" 안내 문구를 은은하게(낮은 opacity, 다크 텍스트 대비) 표시. `StarfieldBackground`가 이미 배경 역할을 하고 있으므로 화면이 완전히 빈 채로 멈추지 않음.

### 4.8 `AudioController.tsx`
- `public/media/audio/background.mp3`를 `<audio loop>`로 재생. 브라우저 자동재생 정책 대응을 위해 최초 키 입력(사용자 인터랙션) 시점에 `play()`를 트리거.
- 음소거 토글 버튼 + 볼륨 슬라이더(0~1) UI 제공. 파일 로드 실패(`onError`) 시 컨트롤 UI 자체를 숨기거나 비활성화 상태로 표시(오류 문구는 표시하지 않아도 무방 — PRD는 영상 실패에 대해서만 안내 문구를 요구).

---

## 5. 타이핑 이펙트 상태머신 상세 설계

### 5.1 글자 상태 정의

```typescript
// src/types/typing.ts
export type CharStatus =
  | "pending"   // 아직 입력되지 않은 글자 (기본 상태, 흐린 톤)
  | "glowing"   // 방금 정확히 입력됨 — glow 채움 애니메이션 재생 중 (0~300ms)
  | "settled"   // glow 애니메이션 종료 후, 파티클도 소멸 완료된 안정 상태 (수 초간 유지)
  | "fading"    // settled 유지 시간 경과 후 서서히 투명해지는 중
  | "gone";     // 페이드아웃 완료, 시각적으로 사라짐 (판정에는 계속 "정확히 입력됨"으로 유지)

export interface CharState {
  char: string;
  status: CharStatus;
  isTypo: boolean;        // 현재 이 위치에 오타가 입력된 상태인지 (status와 독립적인 플래그)
  glowStartedAt: number | null;  // performance.now() 기준 타임스탬프, 상태 전이 스케줄링용
}
```

### 5.2 상태 전이 다이어그램 (텍스트)

```
[pending] --(정확한 글자 입력)--> [glowing] --(300ms 경과)--> [settled]
[pending] --(오타 입력)--> [pending] (isTypo=true, 옅은 붉은 밑줄만 표시, status 불변)
                                  --(정정 입력 시)--> isTypo=false 후 위 정상 흐름 진행

[settled] --(N초 경과, 기본 4~5초)--> [fading] --(600~800ms fade transition)--> [gone]

[gone] 상태여도 charState.status만 시각 처리용이며,
문장 완료 판정(useSentenceTyping)은 "해당 인덱스가 pending을 벗어났는가"만 확인 →
gone이 되어도 완료 판정에는 영향 없음 (수용 기준 명시 요건).
```

- **중요 설계 원칙**: "정확히 입력되었는가"라는 **판정 상태**와 "현재 화면에 어떻게 보이는가"라는 **시각 상태(CharStatus)**를 분리한다. `useSentenceTyping`은 `correctIndex`(정확히 입력 완료된 글자 수)만으로 문장 완료를 판단하고, `CharStatus`는 오직 `useCharEffects`가 시각 연출을 위해서만 관리한다. 이렇게 하면 이펙트 렌더링이 어떤 이유로 지연/실패해도 입력 진행 자체에는 영향이 없다(기능 2 수용 기준: "저사양 환경에서 이펙트가 정상 렌더링되지 않아도 문장 입력 진행에는 영향 없음").

### 5.3 오타 표시 (isTypo)

- 오타는 별도 상태가 아니라 `isTypo: boolean` 플래그로 표현. 사용자가 현재 커서 위치에 틀린 글자를 입력하면 해당 인덱스의 `isTypo = true`로 설정하고, `TypingChar`는 옅은 붉은 밑줄(`border-b border-red-400/50`)만 추가로 렌더링(배경색 변경, 흔들림 애니메이션, 경고음 등 자극적 연출 없음).
- 사용자가 이어서 올바른 글자를 입력하면 `isTypo`를 초기화하고 정상 `glowing` 전이 흐름을 시작한다.
- 오타는 문장 진행에 영향을 주지 않음(같은 인덱스에 계속 재입력 가능, 문장 리셋 없음) — PRD 기능 1 수용 기준과 정확히 일치.

### 5.4 타이밍 스케줄링 구현 방식

- `useCharEffects`는 각 글자에 대해 `glowStartedAt` 타임스탬프를 기록하고, `requestAnimationFrame` 루프(이미 `useParticleSystem`이 돌리는 루프에 편승 — 루프를 이중으로 만들지 않음)에서 매 프레임 경과 시간을 계산해 `glowing → settled`, `settled → fading → gone` 전이를 수행한다.
- `setTimeout`을 남발하지 않고 단일 rAF 루프에서 시간 비교로 상태 전이를 처리함으로써, 빠른 연속 타이핑 시 타이머 수십 개가 누적되는 문제(브라우저 타이머 스로틀링, 클리어 누락에 의한 메모리 누수)를 방지한다. 이는 PRD의 "빠른 연속 타이핑에도 이펙트가 밀리지 않음" 요건과 직결된다.
- glow 지속시간(300ms), settled 유지시간(4~5초), fade 지속시간(600~800ms)은 `src/lib/particle-utils.ts` 또는 상수 파일에 명시적 상수로 정의해 튜닝 가능하게 한다.

### 5.5 100ms 이내 입력 반영 보장 방안

- 키 입력 이벤트(`onKeyDown` 또는 hidden `<input>`의 `onChange`)에서 `useSentenceTyping`의 판정 함수를 동기적으로 호출해 `CharState` 배열을 즉시 갱신 → React 상태 업데이트는 debounce/throttle 없이 즉시 반영(리액트 배치 렌더링 자체가 일반적으로 수 ms~10ms대이므로 100ms 요건에 여유 있게 부합).
- `glowing` 진입과 파티클 스폰은 같은 이벤트 핸들러 틱에서 트리거되므로, "글자 채움 시작"이 100ms 이내에 나타난다는 요건을 만족한다. 파티클의 물리적 확산 애니메이션 자체는 최대 1초까지 지속될 수 있으나, 이는 "시작"이 아니라 "지속 재생"이므로 100ms 요건과 무관하다(PRD 문구: "글자 채움, 반짝임 **시작**에 반영").

### 5.6 60fps 및 파티클 풀링 설계

```typescript
// src/hooks/useParticleSystem.ts (개념적 시그니처)
interface Particle {
  x: number; y: number;
  vx: number; vy: number;   // 방향/속도 (사방으로 흩어짐)
  life: number;             // 남은 수명 (0~1, 1초 이내 소멸)
  size: number;
  alpha: number;
}
interface UseParticleSystemReturn {
  spawnAt: (x: number, y: number, count?: number) => void; // 글자당 6~10개 스폰
}
function useParticleSystem(canvasRef: React.RefObject<HTMLCanvasElement>): UseParticleSystemReturn {
  // 고정 크기 배열(object pool, 예: 최대 300개)을 미리 할당해 재사용
  // 매 rAF 프레임: 살아있는 파티클만 update(위치/알파 감쇠) 후 canvas.clearRect + draw
  // 빠른 연속 입력으로 스폰 요청이 몰릴 경우, 풀 상한을 넘는 요청은 가장 오래된 파티클을 재활용(덮어쓰기)하여
  // 배열이 무한정 커지지 않도록 제한 (60fps 유지의 핵심 장치)
}
```
- 파티클 배열을 매 프레임 새로 생성(`push`/`filter`로 새 배열 반환)하지 않고, **고정 크기 배열을 in-place로 갱신**하는 객체 풀링 방식을 채택해 GC 압박을 최소화한다. 이는 "빠른 연속 타이핑에도 밀리지 않음"과 "60fps" 요건을 동시에 만족시키기 위한 핵심 구현 결정이다.

---

## 6. 로컬 미디어 파일 경로 규칙 및 폴백 로직

### 6.1 폴더/파일명 규칙

```
public/media/
├── video/
│   └── background.mp4     # 배경 영상 (고정 파일명, 사용자가 직접 이 경로에 배치)
└── audio/
    └── background.mp3     # 배경 음악 (mp3 기본, wav 사용 시 아래 다중 source 규칙 참고)
```

- 파일명은 `background.mp4`, `background.mp3`로 고정한다(테마별 다중 파일 불필요 — PRD가 단일 배경/단일 음악을 전제하므로 파일명 복잡도를 최소화). 향후 확장(여러 테마)이 필요해지면 `background-{themeId}.mp4` 형태로 확장 가능하도록 상수(`MEDIA_PATHS`)를 한 곳에 모아둔다.
- 오디오 포맷 다양성 대응: `<audio>` 태그 내부에 `<source src="/media/audio/background.mp3" type="audio/mpeg" />`와 `<source src="/media/audio/background.wav" type="audio/wav" />`를 순서대로 배치해, mp3가 없으면 브라우저가 자동으로 다음 source를 시도하도록 구성(둘 다 없으면 전체 `onError`로 폴백).

```typescript
// src/lib/media-paths.ts (또는 types/media.ts 인접 상수)
export const MEDIA_PATHS = {
  video: "/media/video/background.mp4",
  audioSources: [
    { src: "/media/audio/background.mp3", type: "audio/mpeg" },
    { src: "/media/audio/background.wav", type: "audio/wav" },
  ],
} as const;
```

### 6.2 폴백 감지 로직 (`useBackgroundMedia.ts`)

```typescript
// src/types/media.ts
export type MediaLoadStatus = "loading" | "ready" | "error";

export interface UseBackgroundMediaReturn {
  videoStatus: MediaLoadStatus;
  audioStatus: MediaLoadStatus;
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
}
```

- **비디오**: `<video>`에 `onError` 핸들러와 함께, 진입 후 3초 타이머(PRD 비기능 요구사항: "3초 이내 재생 시작, 초과 시 대체 화면")를 설정. `onPlaying` 이벤트가 3초 안에 발생하면 타이머를 클리어하고 `videoStatus='ready'`. 3초 내 `onPlaying`이 없거나 `onError`가 먼저 발생하면 `videoStatus='error'`로 전환.
  - 파일이 애초에 `public/media/video/background.mp4` 경로에 존재하지 않으면 브라우저가 즉시(수십~수백 ms 내) `onError`(404)를 발생시키므로, 초기 상태(파일 미준비)에서도 앱이 멈추지 않고 신속히 폴백으로 전환된다(PRD 제약사항: "파일이 아직 준비되지 않은 초기 상태에서도 앱은 정상 실행").
- **오디오**: `<audio>`의 `onError`만으로 충분(재생 시작 시점에 대한 엄격한 시간 제약은 PRD에 없음, 영상과 동시 자동재생 시도). 브라우저 자동재생 정책으로 인해 `play()`가 프로그래밍적으로 거부되는 경우(`NotAllowedError`)는 에러가 아니라 "사용자 인터랙션 대기" 상태로 별도 처리하고, 최초 키 입력 시 재시도한다.
- **폴백 렌더링**: `videoStatus !== 'ready'`인 동안 `BackgroundVideoLayer`는 `<video>`를 렌더링하지 않고 `FallbackNotice`("배경 영상을 준비 중입니다")만 표시한다. `StarfieldBackground`(Canvas 별빛)는 `videoStatus`와 무관하게 항상 렌더링되므로, 폴백 상태에서도 화면이 완전히 빈 채로 멈추지 않고 "기본 다크 배경 + 떠다니는 불빛"이 유지된다(PRD 수용 기준 정확히 충족).
- **격리 원칙**: `useBackgroundMedia`, `useAudioControls`는 `useSentenceTyping`, `useCharEffects`와 상태를 공유하지 않는 완전히 독립된 훅으로 설계한다. 미디어 로드 지연/실패가 타이핑 기능(기능 1, 2)에 영향을 주지 않는다는 PRD 요건을 코드 구조 차원에서 보장한다.

---

## 7. 데이터 모델

```typescript
// src/types/sentence.ts
export interface SentenceItem {
  id: number;       // 부록 A 순번 (1~20), 랜덤/순환 로직에서 참조
  text: string;     // 20~60자 내외 위로 문장
}

// src/types/typing.ts
export type CharStatus = "pending" | "glowing" | "settled" | "fading" | "gone";

export interface CharState {
  char: string;
  status: CharStatus;
  isTypo: boolean;
  glowStartedAt: number | null;
}

export interface SentenceTypingState {
  currentSentence: SentenceItem;
  charStates: CharState[];
  correctCount: number;     // 정확히 입력 완료된 글자 수 (문장 완료 판정 기준)
  previousSentenceId: number | null; // 직전 문장 ID (연속 2회 반복 방지용)
}

// src/types/media.ts
export type MediaLoadStatus = "loading" | "ready" | "error";
```

```typescript
// src/data/sentences.ts
import type { SentenceItem } from "@/types/sentence";

export const SENTENCES: SentenceItem[] = [
  { id: 1, text: "오늘 하루도 참 애썼어요. 이제 잠시 모든 걸 내려놓아도 괜찮아요." },
  { id: 2, text: "괜찮아, 조금 느려도 돼. 삶은 속도가 아니라 방향이니까." },
  // ... 부록 A 20개 문장 전체 (id 1~20)
];
```

---

## 8. 비기능 요구사항 충족 방안 요약

| 요구사항 | 구체적 기술 방안 |
|---------|------------------|
| 키 입력 100ms 이내 화면 반영 | `useSentenceTyping`이 입력 이벤트 핸들러 내에서 동기적으로 `CharState` 갱신, debounce/throttle 미적용. glowing 전이와 파티클 스폰 트리거를 같은 이벤트 틱에서 실행. |
| 이펙트 60fps, 입력 판정 지연 없음 | 판정 로직(`useSentenceTyping`)과 이펙트 로직(`useCharEffects`, `useParticleSystem`)을 완전히 분리된 훅으로 설계. 파티클은 고정 크기 객체 풀 + 단일 rAF 루프로 처리해 GC/타이머 오버헤드 최소화. |
| 배경 영상 3초 이내 재생 시작, 초과 시 대체 화면 | `useBackgroundMedia`가 3초 타이머와 `onPlaying`/`onError` 이벤트를 함께 감지, 초과 시 `videoStatus='error'`로 전환해 `FallbackNotice` 렌더링. |
| 데스크톱 최소 1024px에서 레이아웃 미손상 | Tailwind의 `max-w-*`, `min-w-[1024px]` 또는 컨테이너 쿼리 없이 표준 반응형 유틸리티로 중앙 정렬된 고정 폭 문장 영역 구성. 별도 모바일 대응은 향후 확장 범위로 제외(PRD 접근성 항목이 데스크톱 기준임을 명시). |
| 어두운 배경 위 텍스트 가독성 대비 | 배경 영상/별빛 레이어 위에 `bg-black/50` 다크 오버레이 + 텍스트에 `drop-shadow`/밝은 색상(`text-white/90` 등) 고정 적용, 영상 밝기와 무관하게 대비 유지. |
| 외부 API/인증키 없음(보안 해당 없음) | 전체 설계에 서버 API Route, 환경변수, 외부 fetch가 전혀 없음 — 순수 클라이언트 컴포넌트 + 정적 파일로만 구성. |

---

## 9. 구현 Phase 제안

개발자가 순서대로 구현할 수 있도록 단계별로 제안한다.

**Phase 1 — 데이터 및 타입 기반 작업**
1. `src/types/sentence.ts`, `src/types/typing.ts`, `src/types/media.ts` 작성
2. `src/data/sentences.ts`에 부록 A 20개 문장 입력
3. `src/lib/sentence-utils.ts` (직전 문장 연속 방지 랜덤 선택, 순환 로직) 작성 및 단순 단위 검증

**Phase 2 — 문장 타이핑 코어 (기능 1)**
4. `src/lib/typing-judge.ts` (글자 단위 정확/오타 판정 순수 함수) 작성
5. `src/hooks/useSentenceTyping.ts` 작성 — 문장 진행, 오타 처리, 완료 시 1초 이내 자동 전환
6. `src/components/typing/SentenceTypingArea.tsx`, `TypingChar.tsx` (이펙트 없이 우선 정적 상태만) 작성 후 키보드 입력 → 글자 판정 흐름 확인

**Phase 3 — 타이핑 이펙트 (기능 2)**
7. `src/hooks/useCharEffects.ts` (상태머신 전이 스케줄링) 작성
8. `src/lib/particle-utils.ts`, `src/hooks/useParticleSystem.ts` (객체 풀 기반 파티클) 작성
9. `src/components/typing/CharParticleCanvas.tsx` 작성 및 `TypingChar`의 glow/fade CSS 클래스와 연결
10. 빠른 연속 타이핑 시나리오로 프레임 드랍/판정 지연 여부 수동 검증

**Phase 4 — 다크 배경 및 로컬 미디어 (기능 3)**
11. `src/components/background/StarfieldBackground.tsx` (떠다니는 별빛, Canvas 2D) 작성
12. `src/types/media.ts` 기반 `src/hooks/useBackgroundMedia.ts` 작성 (3초 타이머, onError 감지)
13. `src/components/background/BackgroundVideoLayer.tsx`, `FallbackNotice.tsx` 작성
14. `src/hooks/useAudioControls.ts`, `src/components/audio/AudioController.tsx` 작성 (음소거/볼륨, 다중 source)
15. `public/media/video/`, `public/media/audio/` 폴더만 생성(빈 상태)해 폴백 동작을 우선 확인 → 이후 사용자가 실제 미디어 파일을 배치했을 때도 즉시 동작하는지 확인

**Phase 5 — 통합 및 전체 검증**
16. `src/components/typing/HealingTypingScreen.tsx`에서 전체 레이어 조합, z-index/오버레이 대비 확인
17. `src/app/page.tsx`, `layout.tsx` 연결
18. 검증 매트릭스(10장) 기준으로 수용 기준 18개 전량 수동 검증

---

## 10. 검증 매트릭스

| PRD 기능 | TECH_SPEC 구현 | 파일 | 테스트 기준 |
|----------|---------------|------|-----------|
| 기능 1 — 항상 문장 1개 표시, 완료 시 1초 이내 다음 문장 전환 | `useSentenceTyping` (완료 감지 + setTimeout ≤1000ms) | `src/hooks/useSentenceTyping.ts` | 문장 마지막 글자 입력 직후 1초 이내 다음 문장으로 교체되는지 타이밍 측정 |
| 기능 1 — 부록 A 문장 목록(20~60자), 같은 문장 연속 2회 금지 | `SENTENCES`, `pickNextSentence` (previousSentenceId 제외 로직) | `src/data/sentences.ts`, `src/lib/sentence-utils.ts` | 다수 시행 시 동일 id 연속 등장 없음 확인, 각 문장 글자 수 20~60자 검증 |
| 기능 1 — 오타 시 게임 미종료, 정정 후 진행 지속 | `typing-judge.ts` 판정 로직 + `isTypo` 플래그 | `src/lib/typing-judge.ts`, `src/hooks/useSentenceTyping.ts` | 오타 입력 후 문장 리셋 없음, 정정 입력 시 다음 글자로 정상 진행 확인 |
| 기능 1 — 타이머/카운트다운/순위/게임오버 부재 | 전체 상태 모델에 관련 필드 미정의 | `src/types/typing.ts`, `src/hooks/useSentenceTyping.ts` | 코드 리뷰로 타이머/점수/생명력 관련 상태·컴포넌트 부재 확인 |
| 기능 1 — 진행 상태 미저장에도 오류 없음 | localStorage 등 영속 저장소 미사용, 메모리 상태만 | `src/hooks/useSentenceTyping.ts` | 새로고침/페이지 이탈 후 재진입 시 에러 없이 초기 문장부터 정상 시작 확인 |
| 기능 1 — 문장 소진 시 순환(끊기지 않음) | `pickNextSentence`의 순환/재선택 로직 | `src/lib/sentence-utils.ts` | 20개 문장 모두 노출 이후에도 계속 다음 문장이 제공되는지 확인 |
| 기능 2 — 정확 입력 시 0.3초 내외 glow 채움 애니메이션 | `CharStatus='glowing'` + `tailwind.config.ts`의 `glow-in` keyframe 확장 | `src/components/typing/TypingChar.tsx`, `tailwind.config.ts` | 글자 입력 시 약 300ms 지속되는 glow 시각 효과 육안/DevTools Animation 패널 확인 |
| 기능 2 — 입력 순간 빛 파티클 사방 확산 후 1초 이내 소멸 | `useParticleSystem.spawnAt` + 파티클 `life` 감쇠 | `src/hooks/useParticleSystem.ts`, `src/components/typing/CharParticleCanvas.tsx` | 글자 입력 시 파티클 스폰 및 1초 이내 알파 0 도달 확인 |
| 기능 2 — settled 글자 일정 시간 후 fade out, 판정엔 영향 없음 | `CharStatus` 전이(settled→fading→gone), 판정은 `correctCount`로 별도 관리 | `src/hooks/useCharEffects.ts`, `src/hooks/useSentenceTyping.ts` | 글자가 시각적으로 사라진 뒤에도 문장 완료 판정이 정상 동작하는지 확인 |
| 기능 2 — 오타는 비자극적 방식(옅은 밑줄)으로 표시 | `isTypo` 플래그 + `border-b border-red-400/50` 클래스 | `src/components/typing/TypingChar.tsx` | 오타 시 사운드/흔들림 없이 옅은 밑줄만 표시되는지 확인 |
| 기능 2 — 빠른 연속 타이핑에도 이펙트 밀림/겹침 없음 | 고정 크기 객체 풀 + 단일 rAF 루프 | `src/hooks/useParticleSystem.ts`, `src/hooks/useCharEffects.ts` | 빠른 연속 입력(초당 5~10타) 시나리오에서 프레임 드랍/이펙트 큐잉 지연 여부 프로파일링 |
| 기능 2 — 저사양 환경에서 이펙트 실패해도 입력 판정 영향 없음 | 판정 로직과 이펙트 로직의 완전 분리 설계 | `src/hooks/useSentenceTyping.ts` vs `src/hooks/useCharEffects.ts`/`useParticleSystem.ts` | Canvas 컨텍스트 강제 실패 상태에서도 문장 입력 진행 정상 동작 확인 |
| 기능 3 — 다크 톤 배경 + 떠다니는 불빛 상시 표시 | `StarfieldBackground` (Canvas 2D, 항상 렌더링) | `src/components/background/StarfieldBackground.tsx` | 영상 로드 여부와 무관하게 별빛 파티클이 항상 부유하는지 확인 |
| 기능 3 — 배경 영상 3초 이내 재생 시작 및 반복 재생 | `useBackgroundMedia` 3초 타이머 + `<video loop>` | `src/hooks/useBackgroundMedia.ts`, `src/components/background/BackgroundVideoLayer.tsx` | `public/media/video/background.mp4` 배치 후 진입 시 3초 이내 재생 시작 측정, loop 속성 확인 |
| 기능 3 — 배경 음악 자동 재생 + 음소거/음량 조절 | `useAudioControls`, `AudioController` UI | `src/hooks/useAudioControls.ts`, `src/components/audio/AudioController.tsx` | 음소거 토글, 슬라이더 조작 시 실제 오디오 볼륨 반영 확인 |
| 기능 3 — 미디어 파일 부재/로드 실패 시 다크 배경+안내 문구로 대체 | `videoStatus==='error'` 분기 → `FallbackNotice` | `src/hooks/useBackgroundMedia.ts`, `src/components/background/FallbackNotice.tsx` | `public/media/video/`, `audio/`가 빈 상태에서도 화면이 멈추지 않고 안내 문구 노출 확인 |
| 기능 3 — 배경과 텍스트 간 대비 유지 | 다크 오버레이(`bg-black/50`) + 텍스트 `drop-shadow`/밝은 색상 | `src/components/typing/HealingTypingScreen.tsx` | 영상 배경 유무 각 상태에서 텍스트 가독성 육안 확인 |
| 기능 3 — 미디어 로드 지연/실패가 기능 1·2에 영향 없음 | 미디어 훅과 타이핑 훅의 완전 독립 설계(공유 상태 없음) | `src/hooks/useBackgroundMedia.ts` vs `src/hooks/useSentenceTyping.ts` | 미디어 강제 실패(404) 상태에서 문장 타이핑 및 이펙트가 정상 동작하는지 확인 |
