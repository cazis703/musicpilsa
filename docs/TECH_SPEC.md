# TECH_SPEC: 힐링 타이핑 - 효과음 설정 & 배경음악 재생 컨트롤

> PRD 참조: docs/PRD.md
> 대상 기능: 기능 1(효과음 설정), 기능 2(배경음악 재생/일시정지 컨트롤)
> 전제: 완전 클라이언트 로컬 앱(백엔드/DB 없음). 새 라이브러리 도입 없이 기존 React hooks + 브라우저 네이티브 Audio API만 사용한다.

---

## 1. 기술 스택

| 구분 | 기술 | 버전 | 선정 근거 |
|------|------|------|----------|
| Framework | Next.js (App Router) | 14.2.35 (기존) | 기존 프로젝트 그대로 사용. 변경 없음. |
| UI Library | React | ^18.3.1 (기존) | 기존 프로젝트 그대로 사용. 변경 없음. |
| Styling | Tailwind CSS | ^3.4.4 (기존) | 기존 프로젝트 그대로 사용. 새 원형 버튼(`PlayPauseButton`)도 유틸리티 클래스로 구현. |
| Audio 재생 | 브라우저 네이티브 `HTMLAudioElement` / `Audio()` | - | Howler.js 등 신규 오디오 라이브러리 도입 없이, 기존 `useAudioControls.ts`가 이미 `<audio>` 엘리먼트를 직접 다루고 있는 패턴을 그대로 확장. 효과음 3종도 동일하게 `new Audio(src)`로 처리해 의존성을 늘리지 않는다. |
| 효과음 겹침 방지 | 자체 구현 `SoundPool` (Audio 인스턴스 풀링) | - | 아래 "3.1.3 비기능 요구사항 대응" 참조. 외부 라이브러리 없이 순수 JS 클래스로 해결 가능한 문제이므로 신규 의존성 추가하지 않음. |
| 상태 관리 | React hooks (`useState`/`useCallback`/`useRef`/`useEffect`) | - | 기존 패턴과 동일. Redux/Zustand 등 도입하지 않음. |
| 값 영속화 | `window.localStorage` | - | 백엔드/DB 없는 완전 로컬 앱이므로 PRD의 "MVP/로컬 → localStorage" 가이드를 그대로 따름. 효과음 볼륨·배경음악 볼륨 두 값만 저장하는 매우 단순한 요구이므로 별도 스토리지 라이브러리 불필요. |

---

## 2. 프로젝트 구조

```
public/
└── media/
    ├── audio/                       # 기존 배경음악 (변경 없음)
    ├── video/                       # 기존 배경 영상 (변경 없음)
    └── sfx/                         # [신규] 효과음 3종 에셋 (코드로 합성한 WAV, 저작권 이슈 없음)
        ├── key-tap.wav              # 타건음
        ├── sentence-complete.wav    # 문장 완료음
        └── ui-click.wav             # 버튼 클릭음

src/
├── components/
│   ├── audio/
│   │   ├── AudioController.tsx      # [수정] 재생/일시정지 버튼, 효과음 볼륨 슬라이더 추가
│   │   ├── NowPlaying.tsx           # 변경 없음
│   │   └── PlayPauseButton.tsx      # [신규] 원형 재생/일시정지 토글 버튼
│   ├── typing/
│   │   ├── HealingTypingScreen.tsx  # [수정] useSoundEffects 연결, 클릭음 래핑
│   │   ├── SkipButton.tsx           # 변경 없음 (클릭음은 HealingTypingScreen의 핸들러 래핑에서 처리)
│   │   └── ThemeSwitcher.tsx        # 변경 없음 (위와 동일)
│   └── ui/
│       └── icons.tsx                # [수정] PlayIcon, PauseIcon, NoteIcon 추가
├── hooks/
│   ├── useAudioControls.ts          # [수정] isPlaying/togglePlay 추가, 볼륨 localStorage 연동
│   ├── useBackgroundMedia.ts        # 변경 없음
│   ├── useSentenceTyping.ts         # [수정] onCharTyped/onSentenceComplete 콜백 파라미터 추가
│   └── useSoundEffects.ts           # [신규] 효과음 3종 재생/볼륨 관리 훅
└── lib/
    ├── media-paths.ts               # 변경 없음
    └── sound-pool.ts                # [신규] Audio 인스턴스 풀링 클래스 (효과음 겹침/끊김 방지)
```

---

## 3. 구현 명세

### 기능 1: 효과음 설정 → 구현 명세

> PRD 매핑: 기능 1 - 타건음/완료음/클릭음 3종을 재생하고, 배경음악과 별도의 볼륨으로 조절하며, 새로고침 후에도 값이 유지된다.

#### 3.1.1 신규 파일: `src/lib/sound-pool.ts`

여러 효과음이 짧은 간격으로 연속 재생될 때(빠른 연속 타이핑) 소리가 끊기거나 겹쳐 들리는 문제를 해결하기 위한 핵심 유틸리티.

**문제의 원인**: 하나의 `HTMLAudioElement`(또는 `Audio` 인스턴스)는 동시에 두 번 재생할 수 없다. 이미 재생 중인 인스턴스에 `.play()`를 다시 호출하면 재생 위치가 `currentTime = 0`으로 리셋되며 직전 소리의 꼬리가 잘려나가고, 이것이 "빠른 연속 입력 시 소리가 끊기거나 이상하게 들리는" 현상의 원인이다.

**해결 방식(Audio 인스턴스 풀링)**: 효과음 종류별로 여러 개의 `Audio` 인스턴스를 미리 만들어두고(pool), 재생 요청이 올 때마다 라운드 로빈 방식으로 다음 인스턴스를 사용한다. 각 인스턴스는 서로 독립적이므로 이전 재생이 끝나지 않은 상태에서 새 요청이 와도 겹쳐서(중첩) 재생될 뿐 서로를 끊지 않는다.

```typescript
export class SoundPool {
  private pool: HTMLAudioElement[];
  private index = 0;

  constructor(src: string, poolSize: number, initialVolume: number) {
    this.pool = Array.from({ length: poolSize }, () => {
      const audio = new Audio(src);
      audio.preload = "auto"; // 마운트 시점에 미리 로드해, 재생 시점 지연을 없앤다.
      audio.volume = initialVolume;
      return audio;
    });
  }

  play(): void {
    const audio = this.pool[this.index];
    this.index = (this.index + 1) % this.pool.length;
    audio.currentTime = 0; // 재사용 시 항상 처음부터 재생
    audio.play().catch(() => {
      // 브라우저 자동재생 정책 등으로 거부되어도 앱 동작에 영향 없음(무음 유지).
    });
  }

  setVolume(volume: number): void {
    this.pool.forEach((audio) => {
      audio.volume = volume;
    });
  }
}
```

**풀 크기 근거**: 타건음은 초당 여러 번(빠른 타이핑 시 초당 5~10회 이상) 재생될 수 있으므로 풀 크기를 4로 두어 짧은 구간 내 중첩 재생을 흡수한다. 완료음은 문장당 1회만 발생하므로 풀 크기 2, 클릭음은 사용자가 버튼을 연타할 가능성을 고려해 풀 크기 3으로 설정한다.

| 효과음 | 풀 크기 상수 | 값 |
|---|---|---|
| 타건음 | `TYPING_POOL_SIZE` | 4 |
| 완료음 | `COMPLETE_POOL_SIZE` | 2 |
| 클릭음 | `CLICK_POOL_SIZE` | 3 |

#### 3.1.2 신규 파일: `src/hooks/useSoundEffects.ts`

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SoundPool } from "@/lib/sound-pool";

export interface UseSoundEffectsReturn {
  sfxVolume: number;
  setSfxVolume: (value: number) => void;
  playTypingSound: () => void;
  playCompleteSound: () => void;
  playClickSound: () => void;
}

const TYPING_SOUND_SRC = "/media/sfx/key-tap.wav";
const COMPLETE_SOUND_SRC = "/media/sfx/sentence-complete.wav";
const CLICK_SOUND_SRC = "/media/sfx/ui-click.wav";

const TYPING_POOL_SIZE = 4;
const COMPLETE_POOL_SIZE = 2;
const CLICK_POOL_SIZE = 3;

const DEFAULT_SFX_VOLUME = 0.5;
export const SFX_VOLUME_STORAGE_KEY = "musicpilsa:sfxVolume";

export function useSoundEffects(): UseSoundEffectsReturn {
  const [sfxVolume, setSfxVolumeState] = useState(DEFAULT_SFX_VOLUME);
  const typingPoolRef = useRef<SoundPool | null>(null);
  const completePoolRef = useRef<SoundPool | null>(null);
  const clickPoolRef = useRef<SoundPool | null>(null);

  // localStorage 복원은 마운트 이후 1회만 수행한다(useBackgroundMedia의 랜덤 선택과 동일한
  // 이유: 마운트 이전에 브라우저 API/저장값을 읽으면 서버 렌더 결과와 달라져 하이드레이션 불일치가 난다).
  useEffect(() => {
    const stored = window.localStorage.getItem(SFX_VOLUME_STORAGE_KEY);
    if (stored !== null) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setSfxVolumeState(Math.min(1, Math.max(0, parsed)));
      }
    }
  }, []);

  // Audio 풀 생성은 브라우저 API이므로 클라이언트 마운트 시 1회만 생성한다.
  useEffect(() => {
    typingPoolRef.current = new SoundPool(TYPING_SOUND_SRC, TYPING_POOL_SIZE, DEFAULT_SFX_VOLUME);
    completePoolRef.current = new SoundPool(COMPLETE_SOUND_SRC, COMPLETE_POOL_SIZE, DEFAULT_SFX_VOLUME);
    clickPoolRef.current = new SoundPool(CLICK_SOUND_SRC, CLICK_POOL_SIZE, DEFAULT_SFX_VOLUME);
  }, []);

  // 슬라이더 조작 시: 세 풀 모두 동일한 볼륨으로 동기화 + localStorage 저장.
  useEffect(() => {
    typingPoolRef.current?.setVolume(sfxVolume);
    completePoolRef.current?.setVolume(sfxVolume);
    clickPoolRef.current?.setVolume(sfxVolume);
    window.localStorage.setItem(SFX_VOLUME_STORAGE_KEY, String(sfxVolume));
  }, [sfxVolume]);

  const setSfxVolume = useCallback((value: number) => {
    setSfxVolumeState(Math.min(1, Math.max(0, value)));
  }, []);

  // sfxVolume <= 0일 때 play() 자체를 호출하지 않는다: (1) 볼륨 0 = 완전 무음을 코드로
  // 명시적으로 보장하고, (2) 불필요한 재생 호출을 줄여 빠른 연속 타이핑 시 성능 낭비를 막는다.
  const playTypingSound = useCallback(() => {
    if (sfxVolume <= 0) return;
    typingPoolRef.current?.play();
  }, [sfxVolume]);

  const playCompleteSound = useCallback(() => {
    if (sfxVolume <= 0) return;
    completePoolRef.current?.play();
  }, [sfxVolume]);

  const playClickSound = useCallback(() => {
    if (sfxVolume <= 0) return;
    clickPoolRef.current?.play();
  }, [sfxVolume]);

  return { sfxVolume, setSfxVolume, playTypingSound, playCompleteSound, playClickSound };
}
```

#### 3.1.3 수정 파일: `src/hooks/useSentenceTyping.ts` — 타건음/완료음 트리거 연결

기존 시그니처에 선택적 콜백 2개를 파라미터로 추가한다(객체가 아닌 개별 함수 파라미터로 받아, 매 렌더마다 새로 생성되는 인라인 객체로 인한 불필요한 `useCallback` 재생성을 피한다).

```typescript
export function useSentenceTyping(
  onCharTyped?: () => void,
  onSentenceComplete?: () => void
): UseSentenceTypingReturn {
  // ...기존 로직 동일...
```

**정확한 트리거 지점** (`handleInputValue` 내부):

```typescript
const handleInputValue = useCallback(
  (fullValue: string) => {
    const target = currentSentence.text;
    let matchedLength = 0;
    while ( /* ...기존 매칭 로직 동일... */ ) matchedLength++;

    const hasTypo = fullValue.length > matchedLength;
    const previousIndex = cursorIndexRef.current;

    if (matchedLength === previousIndex && !hasTypo) return; // 실질적 변화 없는 입력은 무시

    onCharTyped?.(); // ★ 타건음 트리거 지점: 커서가 전진했거나(정타) 오탈자가 새로 발생한(오타) 실제 입력마다 1회

    const now = performance.now();
    // ...기존 charStates 갱신 로직 동일...

    cursorIndexRef.current = matchedLength;
    setCursorIndex(matchedLength);

    if (matchedLength >= target.length && matchedLength > previousIndex) {
      onSentenceComplete?.(); // ★ 완료음 트리거 지점: 문장을 끝까지 "정확히" 완성한 그 순간에만 도달하는 분기이므로 1회만 실행되고, 오탈자가 있으면 matchedLength가 target.length에 도달할 수 없어 자연히 재생되지 않는다.
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
      const completedSentenceId = currentSentence.id;
      advanceTimeoutRef.current = setTimeout(() => { /* ...기존 동일... */ }, NEXT_SENTENCE_DELAY_MS);
    }
  },
  [activeSetId, currentSentence.id, currentSentence.text, goToNextSentence, onCharTyped, onSentenceComplete]
);
```

- 타건음 트리거 근거: PRD 수용 기준은 "글자를 한 자 입력할 때마다"이며 정타/오타를 구분하지 않는다. 위 early-return 가드를 통과한 모든 입력(정타로 커서 전진 + 오타 발생 + 백스페이스로 오타 상태 진입 등 실질적 변화가 있는 모든 케이스)에서 1회 재생되므로 조건을 정확히 만족한다.
- 완료음 트리거 근거: `matchedLength`는 문장 맨 앞부터 연속으로 정확히 일치한 길이만 누적되므로, 오탈자가 하나라도 있으면 `matchedLength`가 `target.length`에 도달할 수 없다. 따라서 이 분기에 도달하는 것 자체가 "처음부터 끝까지 정확하게 입력 완료"를 의미하며, `matchedLength > previousIndex` 조건 덕분에 완료 상태 진입 순간에만 1회 실행된다(완료 후 추가 입력 이벤트가 와도 재실행되지 않음).

#### 3.1.4 수정 파일: `src/components/typing/HealingTypingScreen.tsx` — 클릭음 연결 및 훅 조립

```typescript
import { useSoundEffects } from "@/hooks/useSoundEffects";

export default function HealingTypingScreen() {
  const { sfxVolume, setSfxVolume, playTypingSound, playCompleteSound, playClickSound } = useSoundEffects();

  const {
    currentSentence, charStates, handleInputValue, confirmIfComplete,
    activeSetId, setActiveSet, skipSentence,
  } = useSentenceTyping(playTypingSound, playCompleteSound);

  const { videoStatus, audioStatus, videoRef, audioRef, videoSrc, audioSrc, nextVideo, nextAudio } =
    useBackgroundMedia();

  // ...

  // ★ 클릭음 트리거 지점 4곳: 기존 핸들러를 그대로 감싸는 방식으로, 각 컴포넌트(AudioController,
  // SkipButton, ThemeSwitcher) 자체는 수정하지 않고 HealingTypingScreen에서 조립만 담당한다.
  const handleNextVideo = useCallback(() => {
    playClickSound();
    nextVideo();
  }, [playClickSound, nextVideo]);

  const handleNextAudio = useCallback(() => {
    playClickSound();
    nextAudio();
  }, [playClickSound, nextAudio]);

  const handleSkip = useCallback(() => {
    playClickSound();
    skipSentence();
    focusHiddenInput();
  }, [playClickSound, skipSentence, focusHiddenInput]);

  const handleSwitchTheme = useCallback(() => {
    playClickSound();
    setActiveSet(pickNextSetId(SENTENCE_SET_META, activeSetId));
    focusHiddenInput();
  }, [playClickSound, activeSetId, setActiveSet, focusHiddenInput]);

  // ...
  return (
    // ...
    <AudioController
      audioRef={audioRef}
      audioStatus={audioStatus}
      audioSrc={audioSrc}
      onNextVideo={handleNextVideo}
      onNextAudio={handleNextAudio}
      sfxVolume={sfxVolume}
      onSfxVolumeChange={setSfxVolume}
    />
  );
}
```

- 4곳 클릭음 연결점: `handleNextVideo`(배경 바꾸기), `handleNextAudio`(음악 바꾸기), `handleSwitchTheme`(테마 전환), `handleSkip`(건너뛰기). PRD가 명시한 4개 버튼과 정확히 1:1로 대응한다. 재생/일시정지 버튼은 PRD 범위에서 클릭음 대상으로 명시되지 않았으므로 포함하지 않는다.

#### 3.1.5 수정 파일: `src/components/audio/AudioController.tsx` — 효과음 볼륨 슬라이더 UI

```typescript
interface AudioControllerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioStatus: MediaLoadStatus;
  audioSrc: string;
  onNextVideo: () => void;
  onNextAudio: () => void;
  sfxVolume: number;
  onSfxVolumeChange: (value: number) => void;
}
```

기존 배경음악 볼륨 슬라이더 바로 뒤에, 동일한 형태(구분선 + 아이콘 + `<input type="range">`)로 효과음 볼륨 슬라이더를 추가한다(PRD 접근성 요구사항: "기존 배경음악 볼륨 조절 장치와 동일한 방식으로 배치").

```tsx
<span className="h-5 w-px bg-white/20" aria-hidden="true" />

<div className="flex items-center gap-3">
  <NoteIcon className="h-5 w-5 text-white/70" aria-hidden="true" />
  <input
    type="range"
    min={0}
    max={1}
    step={0.01}
    value={sfxVolume}
    onChange={(event) => onSfxVolumeChange(Number(event.target.value))}
    aria-label="효과음 볼륨"
    className="w-24 accent-white/80"
  />
</div>
```

- 배경음악 볼륨(`setVolume`, `useAudioControls`)과 효과음 볼륨(`setSfxVolume`, `useSoundEffects`)은 서로 완전히 다른 state/훅이므로, 한쪽을 조작해도 다른 쪽 값에는 물리적으로 영향을 줄 수 없다(수용 기준 4 충족).

#### 3.1.6 볼륨 localStorage 영속화 (효과음 + 배경음악)

| 값 | localStorage 키 | 저장 시점 | 복원 시점 |
|---|---|---|---|
| 효과음 볼륨 | `musicpilsa:sfxVolume` | `useSoundEffects.ts`의 `sfxVolume` 변경 시마다(`useEffect([sfxVolume])`) | `useSoundEffects.ts` 마운트 직후 `useEffect(() => {...}, [])`에서 1회 읽어 state 초기화 |
| 배경음악 볼륨 | `musicpilsa:bgmVolume` | `useAudioControls.ts`의 `volume` 변경 시마다(`useEffect([volume])`) | `useAudioControls.ts` 마운트 직후 `useEffect(() => {...}, [])`에서 1회 읽어 state 초기화 |

두 값 모두 마운트 이후(클라이언트 사이드)에만 읽어 SSR 하이드레이션 불일치를 방지한다(기존 `useBackgroundMedia.ts`가 랜덤 미디어 선택을 마운트 후로 미루는 것과 동일한 패턴). 저장되지 않은 값(최초 방문)일 경우 각각 `0.5`(효과음), `0.5`(배경음악, 기존 기본값 유지)로 폴백한다.

**수용 기준 매핑**:

| PRD 수용 기준 | 구현 방법 |
|--------------|----------|
| 글자 한 자 입력마다 타건음 매번 재생 | `useSentenceTyping.ts` `handleInputValue` 내 early-return 가드 통과 시점마다 `onCharTyped()` → `playTypingSound()` → `SoundPool.play()`(풀링으로 겹침 없이 재생) |
| 문장 완료 시 완료음 1회, 오탈자 있으면 미재생 | `handleInputValue` 내 `matchedLength >= target.length && matchedLength > previousIndex` 분기에서만 `onSentenceComplete()` 호출. 오탈자가 있으면 이 조건에 도달 불가 |
| 4개 버튼(배경/음악/테마/건너뛰기) 클릭 시 클릭음 재생 | `HealingTypingScreen.tsx`의 `handleNextVideo`/`handleNextAudio`/`handleSwitchTheme`/`handleSkip`에서 각각 `playClickSound()` 선(先)호출 |
| 효과음 볼륨 조절 시 배경음악 볼륨 불변 | `useSoundEffects`(sfxVolume)와 `useAudioControls`(volume)는 완전히 독립된 state. `AudioController.tsx`에서 두 슬라이더가 서로 다른 훅의 값/setter를 각각 바인딩 |
| 효과음 볼륨 0 → 3종 모두 무음 | `playTypingSound`/`playCompleteSound`/`playClickSound` 각각 `if (sfxVolume <= 0) return;` 가드로 재생 자체를 차단 |
| 효과음 볼륨 0 초과로 재상향 → 3종 정상 재생 | 위 가드 조건이 `sfxVolume > 0`이 되는 즉시 해제되어 재생 재개 |
| 새로고침/재방문 후 효과음 볼륨 유지 | `musicpilsa:sfxVolume` 저장/복원 (3.1.6) |
| 새로고침/재방문 후 배경음악 볼륨 유지 | `musicpilsa:bgmVolume` 저장/복원 (3.1.6) |

---

### 기능 2: 배경음악 재생/일시정지 컨트롤 → 구현 명세

> PRD 매핑: 기능 2 - 원형 재생/일시정지 토글 버튼으로 배경음악 재생을 사용자가 직접 멈추고 다시 재생한다. 음소거 기능과는 독립적이다.

#### 3.2.1 수정 파일: `src/hooks/useAudioControls.ts` — `isPlaying`/`togglePlay` 확장

완전히 새로운 훅을 만들지 않고 기존 `useAudioControls`를 확장한다. 이유: 이 훅은 이미 동일한 `audioRef`를 대상으로 볼륨/음소거를 제어하고 있어, 재생/일시정지 상태도 같은 오디오 엘리먼트를 다루는 관심사이므로 하나의 훅에 모으는 것이 `AudioController.tsx`의 사용 지점을 늘리지 않고 일관성을 유지한다.

```typescript
export interface UseAudioControlsReturn {
  isMuted: boolean;
  volume: number;
  isPlaying: boolean;
  toggleMute: () => void;
  setVolume: (value: number) => void;
  togglePlay: () => void;
}

export const BGM_VOLUME_STORAGE_KEY = "musicpilsa:bgmVolume";
const DEFAULT_BGM_VOLUME = 0.5;

export function useAudioControls(audioRef: React.RefObject<HTMLAudioElement>): UseAudioControlsReturn {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_BGM_VOLUME);
  const [isPlaying, setIsPlaying] = useState(false);

  // 볼륨 복원 (마운트 후 1회)
  useEffect(() => {
    const stored = window.localStorage.getItem(BGM_VOLUME_STORAGE_KEY);
    if (stored !== null) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) setVolumeState(Math.min(1, Math.max(0, parsed)));
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMuted;
  }, [audioRef, volume, isMuted]);

  // ★ 핵심: isPlaying은 버튼 클릭이 아니라 <audio> 엘리먼트가 실제로 발생시키는
  // 'play'/'pause' 네이티브 이벤트를 구독해 동기화한다. 이렇게 하면 (1) 버튼으로
  // 직접 멈추고 재생하는 경우, (2) 브라우저 자동재생 정책으로 최초 재생이 막힌 경우,
  // (3) useBackgroundMedia가 트랙을 자동 전환(ended)하며 audio.load()/play()를
  // 다시 호출하는 경우까지 모두 "버튼 아이콘이 실제 재생 상태와 100% 일치"해야 한다는
  // 수용 기준을 별도 분기 처리 없이 하나의 리스너로 만족시킬 수 있다.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    setIsPlaying(!audio.paused); // 리스너 부착 시점의 실제 상태로 즉시 동기화
    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [audioRef]);

  useEffect(() => {
    window.localStorage.setItem(BGM_VOLUME_STORAGE_KEY, String(volume));
  }, [volume]);

  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    if (clamped > 0) setIsMuted(false);
  }, []);

  // 상태를 직접 setIsPlaying으로 낙관적 갱신하지 않는다. audio.play()/pause() 호출 결과로
  // 발생하는 네이티브 이벤트가 위 리스너를 통해 상태를 갱신하므로, 상태의 단일 진실 공급원은
  // 항상 실제 <audio> 엘리먼트가 된다(음소거/볼륨과 완전히 독립적으로 동작 — 수용 기준 4, 5).
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [audioRef]);

  return { isMuted, volume, isPlaying, toggleMute, setVolume, togglePlay };
}
```

- 초기 자동재생(수용 기준 3 "자동재생이 정상적으로 시작되면 ❚❚ 상태")과의 정합성: `useBackgroundMedia.ts`가 마운트 시 `audio.play()`를 호출하고, 성공하면 네이티브 `play` 이벤트가 위 리스너를 통해 `isPlaying = true`로 동기화되어 버튼이 자동으로 ❚❚로 표시된다. 자동재생이 브라우저 정책으로 거부되면 `audio.paused`가 계속 `true`로 남아 `isPlaying = false`가 유지되고 버튼은 ▶로 표시된다 — 실제 재생 여부와 항상 일치.
- 음소거/볼륨과의 독립성(수용 기준 4, 5): `isPlaying`은 `play`/`pause` 이벤트로만 갱신되고, `isMuted`/`volume`은 별도 `useEffect`에서 `audio.volume`/`audio.muted` 속성만 다룬다. 서로 다른 state이며 어느 쪽도 상대를 변경하는 코드 경로가 없다.

#### 3.2.2 신규 파일: `src/components/ui/icons.tsx`에 아이콘 2종 추가

기존 `SpeakerMutedIcon`/`SpeakerOnIcon`/`SwitchIcon`과 동일한 패턴(순수 SVG, `IconProps` 재사용)으로 추가.

```typescript
export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 5v14l12-7L7 5Z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

export function NoteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 17V5.5L19 4v11.5M9 17a3 3 0 1 1-2-2.8M19 15.5a3 3 0 1 1-2-2.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

`NoteIcon`은 효과음 볼륨 슬라이더의 시각적 식별용(3.1.5)이며, `PlayIcon`/`PauseIcon`은 아래 `PlayPauseButton`에서 사용한다.

#### 3.2.3 신규 파일: `src/components/audio/PlayPauseButton.tsx`

```typescript
"use client";

import { PauseIcon, PlayIcon } from "@/components/ui/icons";

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export default function PlayPauseButton({ isPlaying, onToggle }: PlayPauseButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isPlaying ? "배경음악 일시정지" : "배경음악 재생"}
      aria-pressed={isPlaying}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white transition-colors hover:bg-slate-600"
    >
      {isPlaying ? (
        <PauseIcon className="h-3.5 w-3.5" />
      ) : (
        <PlayIcon className="h-3.5 w-3.5 translate-x-[1px]" />
      )}
    </button>
  );
}
```

- 디자인: 요청된 "진회색 원형 배경 + 흰색 아이콘"을 `bg-slate-700`(진회색) + `rounded-full` + `text-white`로 구현. `PlayIcon`은 삼각형 무게중심 때문에 시각적으로 약간 왼쪽으로 치우쳐 보이는 현상을 `translate-x-[1px]`로 보정(재생 아이콘 디자인에서 흔한 관례적 보정).
- `aria-pressed`는 기존 음소거 버튼(`SpeakerMutedIcon`/`SpeakerOnIcon`)과 동일한 패턴으로, 스크린 리더가 현재 상태(재생 중/멈춤)를 안내할 수 있게 한다(PRD 접근성 요구사항 충족).

#### 3.2.4 배치 위치: 기존 하단 컨트롤 바(`AudioController.tsx`) 내부

**배치 결정**: 새 위치를 화면에 추가하지 않고, 기존 `AudioController.tsx`의 하단 고정 pill 안에 `NowPlaying` + "음악 바꾸기" 그룹과 스피커/볼륨 그룹 사이에 삽입한다.

**근거**:
1. PRD 접근성 요구사항이 "기존 배경음악 볼륨 조절 장치와 동일한 방식(위치)으로 배치"를 명시하므로, 오디오 관련 모든 컨트롤(음악 정보/전환/음소거/볼륨/재생-정지)을 하나의 예측 가능한 위치에 모으는 기존 원칙을 유지하는 것이 사용성에 유리하다.
2. 별도 위치(예: 화면 우하단 플로팅 버튼)에 배치하면 사용자가 오디오 컨트롤을 두 곳에서 찾아야 해 "동일한 방식으로 눈에 잘 띄게"라는 요구와 오히려 배치된다.
3. `bg-slate-700` 원형 버튼은 주변의 투명 아이콘 버튼들과 확실히 구분되는 시각적 대비를 가지므로, 같은 바 안에 있어도 "재생 자체를 멈추는 별도 기능"이라는 것이 한눈에 구분된다(PRD 요구: 음소거 버튼과 시각적으로도 다른 기능임이 드러나야 함).

```tsx
<div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/40 px-5 py-2 backdrop-blur">
  {/* a. 배경 바꾸기 (기존, onNextVideo → handleNextVideo로 교체) */}
  {/* 구분선 */}
  {/* b. NowPlaying + 음악 바꾸기 (기존, onNextAudio → handleNextAudio로 교체) */}

  {audioStatus !== "error" && (
    <PlayPauseButton isPlaying={isPlaying} onToggle={togglePlay} />
  )}

  <span className="h-5 w-px bg-white/20" aria-hidden="true" />

  {/* c. 스피커 + 볼륨 (기존) */}
  {/* 구분선 */}
  {/* d. NoteIcon + 효과음 볼륨 (신규, 3.1.5) */}
</div>
```

`isPlaying`/`togglePlay`는 `AudioController.tsx` 내부에서 이미 호출 중인 `useAudioControls(audioRef)`의 반환값에서 추가로 구조 분해하면 되며, 새 prop 전달이 필요 없다(기존처럼 `AudioController` 컴포넌트 자신이 훅을 직접 호출).

**수용 기준 매핑**:

| PRD 수용 기준 | 구현 방법 |
|--------------|----------|
| 재생 중 클릭 → 즉시 정지 + 아이콘 ▶ | `togglePlay()`가 `audio.pause()` 호출 → 네이티브 `pause` 이벤트 → `isPlaying=false` → `PlayPauseButton`이 `PlayIcon` 렌더 |
| 정지 중 클릭 → 즉시(또는 멈춘 지점부터) 재생 + 아이콘 ❚❚ | `togglePlay()`가 `audio.play()` 호출(`currentTime`을 건드리지 않으므로 멈춘 지점부터 재생) → `play` 이벤트 → `isPlaying=true` → `PauseIcon` 렌더 |
| 진입 시 자동재생 성공하면 ❚❚ 상태로 표시 | `useBackgroundMedia`의 초기 `audio.play()` 성공 시 `play` 이벤트가 발생해 `isPlaying=true`로 동기화됨(3.2.1) |
| 재생/일시정지 조작해도 음소거/볼륨 불변 | `isPlaying`은 `play`/`pause` 이벤트로만, `isMuted`/`volume`은 별도 `useEffect`로만 갱신되는 완전히 분리된 상태 |
| 음소거 상태에서 정지→재생해도 음소거 유지 | `togglePlay`는 `audio.muted`를 전혀 건드리지 않음. `audio.muted`는 `isMuted` state에 바인딩된 별도 `useEffect`가 계속 유지 |

---

## 4. 데이터 모델

이 기능 범위에는 서버/DB 엔티티가 없으므로, 클라이언트 로컬 저장소(`localStorage`) 스키마를 데이터 모델로 정의한다.

```typescript
// localStorage 스키마 (모두 문자열로 저장되는 0~1 사이의 float)
interface LocalStorageSchema {
  "musicpilsa:sfxVolume": string; // 예: "0.5"  (효과음 전체 볼륨, 기본값 0.5)
  "musicpilsa:bgmVolume": string; // 예: "0.5"  (배경음악 볼륨, 기본값 0.5)
}
```

- 두 키 모두 없으면(최초 방문) 각 훅의 `DEFAULT_*_VOLUME` 상수(0.5)로 폴백한다.
- 저장값이 숫자로 파싱되지 않거나 범위를 벗어나면(`NaN`, 음수, 1 초과) `Math.min(1, Math.max(0, value))`로 clamp 하거나 파싱 실패 시 무시하고 기본값을 유지한다(방어적 파싱).
- 음소거 여부(`isMuted`)와 재생 상태(`isPlaying`)는 PRD 범위에서 영속화 대상이 아니므로 저장하지 않는다.

---

## 5. API 명세

해당 없음. 완전 클라이언트 로컬 앱이며 서버 API/DB 연동이 없다. 효과음/배경음악 볼륨은 전적으로 브라우저의 `localStorage`에서만 다뤄지고 외부로 전송되지 않는다(PRD 보안 요구사항 충족).

---

## 6. 검증 매트릭스

| PRD 수용 기준 | TECH_SPEC 구현 | 파일 | 테스트 기준 |
|---|---|---|---|
| 글자 한 자 입력마다 타건음 매번 재생 | `onCharTyped` 콜백 호출 → `playTypingSound()` → `SoundPool.play()` | `src/hooks/useSentenceTyping.ts`, `src/hooks/useSoundEffects.ts`, `src/lib/sound-pool.ts` | 문장 입력창에 한 글자씩(정타/오타 포함) 입력 시 매번 타건음이 들리는지 수동 청취 확인 |
| 문장 완료 시 완료음 1회, 오탈자 있으면 미재생 | `matchedLength >= target.length && matchedLength > previousIndex` 분기에서만 `onSentenceComplete()` 호출 | `src/hooks/useSentenceTyping.ts` | ① 문장을 정확히 완성 → 완료음 1회 확인 ② 중간에 오타 낸 뒤 정정하지 않고 계속 입력 → 완료음 미재생 확인 |
| 4개 버튼(배경/음악/테마/건너뛰기) 클릭 시 클릭음 | `handleNextVideo`/`handleNextAudio`/`handleSwitchTheme`/`handleSkip`에서 `playClickSound()` 선호출 | `src/components/typing/HealingTypingScreen.tsx` | 4개 버튼 각각 클릭 시 클릭음 재생 확인 |
| 효과음 볼륨 조절 시 배경음악 볼륨 불변 | `useSoundEffects`(sfxVolume)와 `useAudioControls`(volume) 완전 분리 | `src/hooks/useSoundEffects.ts`, `src/hooks/useAudioControls.ts`, `src/components/audio/AudioController.tsx` | 효과음 슬라이더만 조작 후 배경음악 볼륨 슬라이더 값/실제 소리 크기 불변 확인 |
| 효과음 볼륨 0 → 3종 모두 무음 | `sfxVolume <= 0`이면 `play()` 호출 자체를 하지 않음 | `src/hooks/useSoundEffects.ts` | 슬라이더를 0으로 내린 뒤 타이핑/문장완료/버튼클릭 모두 무음 확인 |
| 효과음 볼륨 재상향 → 3종 정상 재생 | 가드 조건(`sfxVolume > 0`) 해제 즉시 재생 재개 | `src/hooks/useSoundEffects.ts` | 0에서 0.5로 슬라이더 이동 후 3종 모두 재생 확인 |
| 새로고침/재방문 후 효과음 볼륨 유지 | `musicpilsa:sfxVolume` 저장(변경 시)/복원(마운트 시) | `src/hooks/useSoundEffects.ts` | 슬라이더 조작 → 새로고침 → 슬라이더 값이 유지되어 있는지 확인 |
| 새로고침/재방문 후 배경음악 볼륨 유지 | `musicpilsa:bgmVolume` 저장(변경 시)/복원(마운트 시) | `src/hooks/useAudioControls.ts` | 슬라이더 조작 → 새로고침 → 슬라이더 값이 유지되어 있는지 확인 |
| 재생 중 클릭 → 정지 + ▶ 아이콘 | `togglePlay()` → `audio.pause()` → `pause` 이벤트 → `isPlaying=false` | `src/hooks/useAudioControls.ts`, `src/components/audio/PlayPauseButton.tsx` | 재생 중 버튼 클릭 → 음악 정지 + 아이콘이 ▶로 바뀌는지 확인 |
| 정지 중 클릭 → 재생 + ❚❚ 아이콘 | `togglePlay()` → `audio.play()` → `play` 이벤트 → `isPlaying=true` | `src/hooks/useAudioControls.ts`, `src/components/audio/PlayPauseButton.tsx` | 정지 중 버튼 클릭 → 음악 재생 재개(멈춘 지점부터) + 아이콘이 ❚❚로 바뀌는지 확인 |
| 진입 시 자동재생 성공하면 ❚❚ 상태 | `play` 네이티브 이벤트 → `isPlaying=true` 자동 동기화 | `src/hooks/useAudioControls.ts` | 페이지 최초 진입(자동재생 성공 환경) 시 버튼이 ❚❚로 표시되는지 확인 |
| 재생/일시정지 조작해도 음소거/볼륨 불변 | `isPlaying`과 `isMuted`/`volume`은 서로 다른 이벤트 소스로 갱신되는 독립 state | `src/hooks/useAudioControls.ts` | 재생↔정지 반복 후 음소거 버튼 상태/볼륨 슬라이더 값 불변 확인 |
| 음소거 상태에서 정지→재생해도 음소거 유지 | `togglePlay`가 `audio.muted`를 전혀 건드리지 않음 | `src/hooks/useAudioControls.ts` | 음소거 ON → 재생/일시정지 버튼으로 정지→재생 → 음소거 아이콘이 여전히 음소거 상태인지 확인 |
| (비기능) 입력과 타건음 사이 체감 지연 없음 | `SoundPool`이 마운트 시 `preload="auto"`로 미리 로드해두고, 재생 시점엔 이미 로드된 인스턴스의 `currentTime=0` + `play()`만 호출 | `src/lib/sound-pool.ts` | 빠르게 타이핑하면서 입력과 소리 사이 지연 체감 여부 수동 확인 |
| (비기능) 빠른 연속 재생 시 소리 끊김/겹침 없음 | 효과음별 Audio 인스턴스 풀(4/2/3개)을 라운드 로빈으로 사용해 이전 재생을 끊지 않고 중첩 재생 | `src/lib/sound-pool.ts` | 문장 전체를 빠르게 연타 입력하며 타건음이 끊기거나 겹쳐 이상하게 들리지 않는지 청취 확인 |

---

## 부록: 효과음 에셋 준비 (완료)

`src/lib/sound-pool.ts`와 `src/hooks/useSoundEffects.ts`가 사용하는 3개 파일은 저작권 이슈 없이 순수 사인파 합성(Node 스크립트, 외부 음원 없음)으로 생성해 `public/media/sfx/`에 이미 배치했다. 기존 `public/media/audio/*.mp3`, `public/media/video/*.mp4` 배치 규칙(`public/media/<타입>/<파일명>`)과 동일한 구조를 따른다.

- `public/media/sfx/key-tap.wav` — 타건음 (약 40ms 짧은 클릭음)
- `public/media/sfx/sentence-complete.wav` — 문장 완료음 (도-미-솔 상승 아르페지오, 약 500ms)
- `public/media/sfx/ui-click.wav` — 버튼 클릭음 (약 80ms 팝음)

추후 더 자연스러운 실제 음원(예: 기계식 키보드 타건음)으로 교체하고 싶다면 같은 파일명으로 덮어쓰기만 하면 되며, 코드 변경은 필요 없다.
