# 작업 기록 (append-only)

## 2026-08-28 — 타이핑음 볼륨 위치 이동 + 배경음 설정 바깥으로 노출

- **타이핑음 볼륨 혼동 개선**: 하단 바에 음표 아이콘 + 볼륨 슬라이더가 음악 슬라이더와 나란히 있어 "이게 뭐의 볼륨인지" 헷갈린다는 피드백 반영.
  - `SfxTypeDropdown.tsx`: `volume`/`onVolumeChange`/`isMuted`/`onToggleMute` optional prop 추가 — 넘기면 드롭다운을 펼쳤을 때 안쪽 상단에 음소거 버튼+볼륨 슬라이더가 뜬다. 안 넘기면(Settings 패널 쪽) 기존과 동일.
  - `AudioController.tsx`: 하단 바의 독립된 음표+슬라이더 블록 제거, 타건음 스위치 드롭다운에 볼륨을 실어 보냄. 이제 하단 바엔 음악 슬라이더 하나만 상시 노출.
- **배경음 설정을 바깥으로 노출**: 기존엔 Settings 패널 안에서만 켜고 끌 수 있었음.
  - `AmbientSoundPicker.tsx`(신규, 공용): 배경음 목록 — 켜짐/꺼짐은 아이콘·라벨 클릭, 켜진 소리는 스위치 대신 우측에 볼륨 슬라이더가 뜨는 형태. Settings 패널과 하단 바 팝업이 이 컴포넌트를 공유.
  - `AmbientSoundControl.tsx`(신규): 하단 바 트리거. 켜진 배경음이 없으면 "배경음" 텍스트, 있으면 아이콘 최대 3개가 겹쳐 쌓이고 "N개 적용 중" 텍스트가 붙는다. 클릭하면 `AmbientSoundPicker` 팝업.
  - `SettingsDrawer.tsx`의 기존 스위치 목록을 `AmbientSoundPicker`로 교체(동일 UI로 통일).
- **확인**: Playwright(`npx playwright@1.62.1`, 프로젝트 의존성엔 추가 안 함)로 dev 서버를 직접 띄워 하단 바/설정 패널 양쪽에서 실제 클릭·드래그로 동작 확인, 콘솔 에러 없음. `tsc --noEmit` 통과.

### 같은 날 후속 피드백 3건 반영
- **배경음 목록 클릭 영역 확대**: `AmbientSoundPicker.tsx` — 아이콘/라벨이 각각 별도 버튼이라 그 사이 여백을 누르면 반응이 없던 문제. 아이콘+라벨을 하나의 버튼(`flex-1`)으로 묶어 슬라이더를 제외한 영역 전체가 클릭 가능하도록 수정.
- **타이핑음 아이콘 통일**: `SfxTypeDropdown.tsx`, `SettingsDrawer.tsx` — 타건음(효과음) 볼륨의 음소거 아이콘을 음표(Note) → 스피커(Speaker) 아이콘으로 통일. 음악 볼륨 아이콘과 같은 스피커 아이콘을 재사용.
- **배경음악 플레이어 그룹핑 + 재생목록**: `AudioController.tsx` — NowPlaying/이전·재생·다음/음량 슬라이더를 옅은 배경(`bg-white/5` pill)으로 한 번 더 감싸 하나의 "플레이어" 덩어리로 보이게 함(기존 각 요소 스타일은 그대로 유지). `MusicPlaylistDropdown.tsx`(신규) — NowPlaying을 누르면 전체 곡 목록(제목+아티스트)이 펼쳐지고 바로 골라 재생 가능. `useBackgroundMedia.ts`에 `selectAudio(path)` 추가(순환 이동이 아닌 임의 선택).
- **확인**: 위와 동일하게 Playwright로 재생목록 열기/곡 선택/타이핑음 드롭다운/배경음 넓은 클릭 영역까지 직접 클릭해서 확인, 콘솔 에러 없음. `tsc --noEmit` 통과.

### 같은 날 마이크로 다듬기
- 재생목록 펼침 목록의 브라우저 기본(흰색) 스크롤바를 `.settings-scroll`(기존 Settings 패널과 동일)로 숨김 — 스크롤 자체는 유지.
- 재생목록/배경음/타이핑음 세 드롭다운 각각 펼쳤을 때 상단에 작은 타이틀 텍스트 추가(`재생목록`/`배경음`/`타이핑음`) — `SfxTypeDropdown`은 기존 `tooltip` prop 문자열을 그대로 재사용.
- 하단 바 설정(톱니바퀴) 아이콘에 다른 드롭다운들과 동일한 스타일의 hover 툴팁("Settings") 추가.
- 재생목록/배경음/타이핑음 세 드롭다운 펼침에 짧은 페이드인(160ms, opacity+살짝 translateY/scale, GPU 합성이라 성능 영향 미미) 추가 — `tailwind.config.ts`에 `dropdown-fade-in`(비중앙정렬용)/`dropdown-fade-in-x`(중앙정렬용) keyframe 2종 신설.
- `SettingsDrawer.tsx`: "타이핑음" 한 섹션으로 묶여있던 볼륨+스위치 종류를 "타이핑 볼륨"/"타이핑음 선택" 두 섹션으로 분리하고, 순서도 하단 바와 동일하게 볼륨이 먼저 나오도록 변경.

### 페이드인 버그 수정 (2026-08-28)
- 처음 구현한 `useDropdownTransition` 훅(rAF 한 번 + 조건부 마운트/언마운트) 방식은 실제로는 트랜지션이 재생되지 않는 버그가 있었음 — React 렌더와 rAF 타이밍이 겹쳐 브라우저가 "닫힌 상태"를 한 번도 그리지 못한 채 바로 최종 상태로 그려버림(mount와 첫 rAF가 같은 프레임에 묶임). `transitionrun`/`transitionend` 이벤트를 직접 계측해 확인.
- **해결**: 조건부 마운트/언마운트를 그만두고, 패널을 항상 DOM에 둔 채 `isOpen` 값에 따라 opacity/transform 클래스만 토글하는 방식으로 변경(`MusicPlaylistDropdown`, `AmbientSoundControl`, `SfxTypeDropdown` 3곳 모두). 이 방식은 최초 페인트부터 "닫힌 상태"가 실제로 그려져 있으므로 rAF 트릭이 필요 없고, 열고 닫을 때 모두 안정적으로 트랜지션이 재생됨(재계측으로 확인 완료). `useDropdownTransition.ts` 훅은 삭제.
- 닫혀있을 때는 `pointer-events-none` + `aria-hidden`/`tabIndex=-1`로 클릭·키보드 포커스를 막아 안 보이는 패널이 인터랙션을 가로채지 않게 함.

### "지금 재생 중" 마이크로 인터랙션 적용 (2026-08-28)
- Artifact로 이퀄라이저 바(A)/펄스 링(B)/스피닝 디스크(C)/텍스트 브리딩 글로우(D)/디스크+파장 합성(E) 5개 후보를 실제 재생목록 드롭다운과 같은 룩으로 만들어 사용자와 함께 비교·확정. 최종 선택: **재생목록 안 활성곡 = A(이퀄라이저 바)**, **하단 바 NowPlaying = B(펄스 링)**.
- `PlayingEqualizer.tsx`(신규): 막대 3개, 서로 다른 음수 `animation-delay`로 어긋난 박자, `isPlaying=false`면 애니메이션을 멈추고 낮은 높이에 얼어붙음. `MusicPlaylistDropdown.tsx`의 활성 트랙 행에 고정폭 슬롯으로 삽입(비활성 트랙과 텍스트 위치가 안 밀리도록).
- `PlayingPulse.tsx`(신규): Tailwind 내장 `animate-ping`로 파장 표현, `isPlaying=false`면 파장 없이 점만 남음. `NowPlaying.tsx`의 기존 회전 디스크(`DiscIcon` + `animate-spin-slow`)를 대체 — 동심원은 완전 대칭이라 회전이 거의 안 보였던 문제도 같이 해결됨.
- `isPlaying`을 `AudioController` → `MusicPlaylistDropdown` → `NowPlaying`/`PlayingEqualizer`까지 새로 threading. 이제 안 쓰는 `DiscIcon`(icons.tsx)과 `spin-slow`(tailwind.config.ts) 제거.
- 확인: Playwright로 재생/일시정지 토글하며 `.animate-ping`/`.animate-eq-bounce` 클래스가 재생 중엔 있고 멈추면 사라지는지 직접 계측, 콘솔 에러 없음. `tsc --noEmit` 통과.

### 후속 수정 — 파장은 원복, 이퀄라이저는 정지 버그 수정
- 사용자가 실제로 보니 이퀄라이저 바가 멈춰있고 파장도 데모와 다르다고 피드백. 원인 재확인: 새로 추가한 `eq-bounce` 커스텀 keyframe이 (이전 `orb-enter` 사고와 동일하게) tailwind.config.ts 변경 후 dev 서버가 재시작 없이는 컴파일된 CSS에 전혀 반영되지 않는 상태였음(`layout.css`에서 `eq-bounce` 0건 확인, 클린 재시작 후 3건으로 확인) — 클래스는 DOM에 있지만 대응하는 keyframe 규칙 자체가 없어 완전히 정지 상태였던 것.
- **파장(B) 관련**: 사용자가 "그냥 원래대로 돌아가는 CD로 하자"고 결정 — `NowPlaying.tsx`를 `DiscIcon` + `animate-spin-slow`로 원복, `PlayingPulse.tsx` 삭제, `tailwind.config.ts`의 `spin-slow`/`DiscIcon`(icons.tsx)도 원복. 재생목록의 이퀄라이저(A)는 그대로 유지.
- **이퀄라이저(A) 관련**: 클린 재시작(`rm -rf .next` + 재기동)으로 해결 — 이후 Playwright로 실제 `scaleY` computed transform 값이 여러 샘플에 걸쳐 진짜로 변하는지(0.31~1.0 사이) 확인 완료.
- **교훈 갱신**: `tailwind.config.ts`에 새 keyframe/animation을 추가한 뒤에는 클래스가 DOM에 있는지만 보지 말고, 컴파일된 CSS 응답에서 그 keyframe 이름이 실제로 존재하는지 curl로 직접 확인하고, 없으면 반드시 클린 재시작할 것 — `feedback_debug-visual-bugs-empirically` 메모리에 반영.

### 이퀄라이저 속도 조정 + 스페이스 오타 시 글자 사라짐 버그 수정
- 이퀄라이저 주기를 0.9s → 1.5s로 늦춤(`tailwind.config.ts`의 `eq-bounce` animation, `PlayingEqualizer.tsx`의 delay도 비율 유지해 -1.0s/-0.5s/-1.5s로 조정). 컴파일된 CSS에 1.5s로 반영된 것까지 확인.
- **버그**: 아무 것도 안 치고 스페이스바만 누르면 문장의 그 글자가 화면에서 사라지는 것처럼 보이는 문제. 원인: `TypingChar.tsx`의 오타 렌더링이 "실제로 입력한 글자"(`typedChar`)를 목표 글자 대신 그대로 보여주는데, 입력한 게 스페이스면 그 글자 자리가 눈에 보이는 공백(사실상 빈칸)이 되어버림 — 다른 오타 글자(글자가 눈에 보이는 경우)에서는 문제없던 로직이 스페이스에서만 "글자가 지워진 것처럼" 보이는 부작용을 냄.
- **수정**: `typedChar`가 공백/빈 문자열이면 그 자리에 실제 입력값 대신 원래 목표 글자를 그대로(빨간색 오타 스타일 유지) 보여주도록 fallback 추가. Playwright로 "오"(첫 글자)가 스페이스 입력 후에도 그대로 보이면서 색만 빨간색으로 바뀌는 것 확인.

### 훨씬 심각한 실제 버그 발견 — "정상 입력도 오타로 표시"
- 사용자가 "정상입력도 오타로 체크하고있어"라고 재보고. Playwright로 목표 문장을 정확히 그대로 타이핑해도 여러 글자가 오타(빨간색)로 표시되는 걸 재현.
- **1차 오진**: 처음엔 `useCharEffects.ts`의 화면 표시 병합 로직이 원인이라 생각했음 — `previous.char === source.char`만으로 "같은 자리"를 판단해서, 문장이 바뀌었는데 우연히 같은 자리에 같은 글자(공백, 흔한 조사 등)가 있으면 그 자리를 "안 바뀐 자리"로 오인하는 버그가 실제로 있었고 고쳤음(`sentenceKey`로 문장이 진짜 바뀌었는지 명시적으로 판단하도록 변경). 하지만 고친 뒤에도 증상이 남아있어 재조사.
- **진짜 원인**: `useSentenceTyping.ts`의 "톤이 바뀌면 charStates를 다시 만든다" 이펙트가 `isFirstToneRenderRef`라는 1회성 ref 플래그로 "마운트 시 최초 1회는 건너뛴다"를 구현하고 있었는데, **React StrictMode(개발 모드)가 마운트 이펙트를 두 번 연속 실행**하면서: 1차 호출 때 플래그를 이미 `false`로 바꿔버려서, 2차 호출이 "진짜 톤 변경"으로 오인되어 실행됨 → 이때 클로저에 잡혀있던 **오래된(문장이 아직 랜덤으로 안 바뀌었을 때의) targetText**로 `charStates`를 덮어씀. 그 결과 화면(charStates 기반)엔 옛 문장이 남아있는데, 판정 기준인 `targetText`(currentSentence 기반, 같은 마운트 이펙트에서 이미 새 문장으로 갱신됨)는 다른 문장을 가리키게 되어, 화면에 보이는 대로 정확히 타이핑해도 전부 오타로 판정됨.
- **디버깅 방법**: 화면 스크린샷/DOM 클래스 존재 여부만으로는 이 불일치를 못 잡음 — `SentenceTypingArea`의 렌더마다 `sentenceProp`(targetText)와 `charStatesJoined`(실제 표시되는 글자들)를 같이 로그로 찍어서야 "targetText는 문장 B로 바뀌었는데 charStates는 문장 A에 계속 고정돼 있다"는 정확한 불일치를 확인할 수 있었음.
- **수정**: `isFirstToneRenderRef` 방식을 버리고, `previousToneRef`에 마지막으로 처리한 tone 값을 저장해 "이번 tone이 그 값과 실제로 다른가"로 판단하도록 변경 — 몇 번을 연달아 호출되든(StrictMode 포함) 안전함(같은 값이면 항상 스킵).
- **확인**: Playwright로 전체 문장을 정확히 타이핑 → 오타 0개, 정상적으로 다음 문장 자동 전환까지 확인. 같은 exact-match 테스트를 4번 반복해도 항상 전부 정타로 표시됨. 스페이스 오타 수정도 여전히 정상 동작.
- **교훈**: "마운트 시 한 번만 실행" 같은 가드를 `useRef` 플래그로 구현하는 패턴은 React StrictMode의 이펙트 이중 호출과 상극이다 — ref는 이중 호출 사이에도 리셋되지 않으므로, 두 번째 호출이 "진짜 이벤트"로 오인될 수 있다. "이전 값과 실제로 다른가"를 직접 비교하는 방식(previousXRef)이 몇 번 호출되든 안전하다.

- **배경 영상 끊김(압축 외 원인) 개선**
  - `useParticleSystem.ts`: 타이핑 파티클 캔버스가 파티클이 하나도 없을 때도 매 프레임(60fps) 화면 전체를 지우고 다시 그리던 루프를 상시로 돌리고 있던 게 발견됨 — 배경 영상과 계속 자원을 나눠 쓰던 실질적 원인으로 추정. 활성 파티클이 없으면 루프를 완전히 멈추고 `spawnAt` 호출 시에만 재개하도록 수정.
  - `StarfieldBackground.tsx`: 별 개수 90 → 45로 축소.
  - `AudioController.tsx`: 하단 컨트롤바의 `backdrop-blur` 제거(영상 위에서 매 프레임 블러 재계산하던 부담 제거) → `bg-black/30`(사용자 확인 후 조정)으로 대체.
  - 사용자 확인: "훨씬 나아졌다" — 확정. 영상 loop+크로스페이드 전환은 사용자가 "더 어색해질 수 있다"고 판단해 보류 상태로 남김(`tasks/todo.md` 참고).
- **배경음 오브 볼륨 조절(바깥 원) UX 개선** — `AmbientOrb.tsx` + `ambient-orb-geometry.ts`
  - 0% 볼륨일 때 바깥 원 최소 크기 축소(`HALO_MIN_VMIN` 6→3.2, `HALO_SIZE_FLOOR_PX` 72→46) — 오브 본체를 얇게 감싸는 정도로.
  - 드래그 가능한 가장자리에 hover/드래그 중일 때 바깥 원이 더 밝아지고 테두리가 더 두꺼워지도록 강조 강화, 벗어나면 원상복귀.
  - 가장자리 위치(각도)에 따라 커서가 수평/수직/대각선 양쪽화살표로 바뀌는 `resizeCursorFromAngle` 헬퍼 추가 — 지금 조작 중인 지점이 어디인지 시각적으로 드러나게 함.
  - 사용자 확인: "기대한대로야 너무좋아" — 확정. 9개 배경음 전부 동일한 공용 컴포넌트(`AmbientOrbLayer`→`AmbientOrb`)를 쓰고 있어 별도 작업 없이 전체 적용됨.
- **배포**: `git push origin main` (5개 커밋, `5cfb746`까지) 후 `vercel --prod`로 프로덕션 배포 완료, `musicpilsa.vercel.app`에 반영 확인.
  - ⚠️ 확인 필요: 배포 이력을 보니 이번 배포도 이전 배포도 모두 `actor: claude-code_agent`(CLI 수동 배포)로 찍혀 있고, GitHub push로 인한 별도의 자동배포 항목은 안 보였음. 사용자는 "자동배포인데?"라고 반응 — Vercel 프로젝트의 Git 자동배포 연동이 실제로 꺼져있는지, 아니면 그냥 확인 타이밍 문제였는지는 다음에 Vercel 대시보드(Settings → Git)에서 확인 필요.

## 2026-08-25 — Glow Orbs(떠다니는 사운드 오브) 목업 A-2 확정

- 대상 파일: `tasks/mockups/sound-orbs-glow-mockup.html` (Artifact로도 게시됨)
- 배경 위에 떠다니는 사운드 오브(파도/빗소리/장작불/풀벌레/싱잉볼/풍경/끓는 물/연필/책장 넘김 9종) 컨셉 목업을 다음 방향으로 확정:
  - 오브의 "전원 배지(켜기/끄기)" 기능 제거. 오브가 화면에 있음 = 켜짐. 사운드 추가/제거는 별도 설정 UI(목업 type B/C, 이 저장소엔 파일 없음)에서 담당 예정.
  - 켜진 오브에 마우스를 올리면 우측 상단에 작은 × 삭제 버튼 노출 → 클릭 시 화면에서 즉시 제거.
  - 안쪽 원(오브 본체) 드래그 = 위치 이동, 바깥 원(halo) 드래그 = 볼륨 조절 — 이 두 동작은 기존 목업과 동일하게 유지.
  - 바깥 원 가장자리에 마우스를 올리면(드래그 전) 링이 밝아지는 어포던스 추가 — 이전엔 커서만 바뀌어 발견성이 낮았음.
- 사용자가 이 상태로 목업 확정.

### 다음 단계용 미확정 결정 사항 (사용자 답변 완료, 실제 구현 시 반영할 것)
- 빗소리는 다운로드된 2개 파일 중 `gentle rain` 하나만 사용 (천둥/캐럴 멜로디 섞인 파일은 사용 안 함).
- 연필 소리: 앞 5초까지만 재생 구간으로 쓰고, 재생 속도 1.5배 느리게.
- 책장 넘기기: 앞 10초까지만 재생 구간으로 쓰고, 재생 속도 2배 느리게.
- 풀벌레: 45초까지만 사용 (※ 원본 파일명엔 "45초부터 잘라야됨"이라 적혀 있어 이 저장소 파일명 메모와 사용자 답변이 반대 방향임 — 실제 구현 시 이 문장 자체를 다시 한 번 확인 필요).
- 오디오 파일 자체를 자르는 도구(ffmpeg 등)가 개발 환경에 없어서, 실제 구현 시엔 파일을 물리적으로 자르지 않고 `<audio>` 재생 구간(시작~끝 초)을 코드로 제한하는 방식으로 처리하기로 함.

### 아직 손대지 않은 것 (당시 기준)
- 실제 앱 코드(`src/`)에는 이 기능이 전혀 연결되지 않은 상태 — 목업/디자인 확정 단계까지만 완료.
- 사운드 추가/제거용 설정 UI(목업 type B/C) 자체가 이 저장소에 없어서, 실제 구현 계획을 세우려면 그 UI가 어떤 모습이었는지 먼저 다시 설명받아야 함.

## 2026-08-25 — Settings 드로어 1단계 실제 앱 적용 (배경음 오브 기능 제외)

- 목업에서 확정한 우측 슬라이드 Settings 드로어를 실제 앱에 적용. 순서: 문장Set+톤 → 사이트타이틀 → 배경 → 음악볼륨 → 타이핑음 → 폰트 → 배경음(2단계에서 채울 placeholder).
- 신규: `src/components/typing/SettingsDrawer.tsx`.
- 수정: `AudioController.tsx`(FontSettingsPanel 제거, ⚙ 버튼 추가, `useAudioControls` 훅을 `HealingTypingScreen`으로 끌어올림), `ThemeSwitcher.tsx`(`getSetIcon` export), `icons.tsx`(`SettingsIcon` 추가), `HealingTypingScreen.tsx`(드로어 조립).
- 삭제: `FontSettingsPanel.tsx` (내용은 SettingsDrawer로 이동, 더 이상 참조 없음 확인 후 삭제).
- 검증: `npm run typecheck` 통과, `npm run dev`로 컴파일 및 200 응답 확인(개발 서버는 확인 후 종료함). 단, 화면 인터랙션(드로어 슬라이드, 값 동기화 등)은 브라우저에서 직접 볼 수 없어 사용자 확인 대기 중.
- `npm run lint`는 이 프로젝트에 ESLint가 아직 설정돼 있지 않아(대화형 초기 설정 프롬프트만 뜸) 실행하지 못함 — 필요시 별도로 설정할 것.

### 사용자 브라우저 확인 후 수정 (같은 날)
1. Settings 패널 배경색을 푸른 톤(`#101731→#0a0e1e`)에서 검은 톤(`neutral-900→black`)으로 변경.
2. **버그 수정** — Settings 안 "받는 사람 이름" 입력창에 타이핑이 안 되던 문제. 원인: `<main>`의 전역 `onClick`이 클릭마다 숨은 타이핑 입력창으로 포커스를 되돌리는데, `SettingsDrawer`가 `SiteTitleBar`처럼 클릭 전파 차단 래퍼 없이 렌더링돼서 안의 입력창 클릭도 포커스를 도둑맞고 있었음. `HealingTypingScreen.tsx`에서 `SiteTitleBar`와 동일하게 `stopPropagation` 래퍼로 감싸서 해결.
3. 설정(⚙) 아이콘을 흔히 보는 기어 모양(Feather 스타일)으로 교체.
4. Settings 헤더의 "여기서 전부 조절할 수 있어요" 설명 문구 삭제.
5. `VolumeSlider`에 `className` prop 추가(기본값 `w-24 shrink-0` 유지, 하단 바는 그대로) — Settings 안의 음악/타이핑음 볼륨 슬라이더는 `flex-1`로 행 끝까지 채워지도록 변경.
- 검증: `npm run typecheck` 통과, 별도 포트로 `npm run dev` 컴파일/200 확인 후 그 서버만 종료(사용자가 켜둔 개발 서버는 건드리지 않음).

### 두 번째 라운드 수정 (같은 날)
1. 설정 아이콘을 채워진(fill) 스타일의 흔한 톱니바퀴 모양으로 교체(스피커 아이콘과 동일 크기 유지).
2. 헤더 "설정" → "Settings"로 변경, 옆에 "Reset" 버튼 추가. Reset은 **조절 가능한 설정값만** 기본값으로 되돌림(문장 톤/타이틀/음악·타이핑 볼륨·타건음 종류/폰트) — 지금 보고 있는 문장 Set이나 배경 영상 자체는 콘텐츠 선택이라 판단해 되돌리지 않음(사용자 의도와 다르면 알려주면 범위 조정 가능).
3. "위로" Set 선택 중엔 문장 톤 UI 자체를 숨김(이전엔 비활성화+툴팁이었음).
4. 5개 그룹으로 아주 얇은 구분선(`divide-white/[0.06]`) 추가: [문장Set+톤] · [사이트타이틀] · [배경+음악볼륨+타이핑음 — 묶어서 하나] · [폰트] · [배경음].
5. 최하단에 "ⓒ 2026 cazis" 카피라이트 문구(작고 옅게) 추가 — 스크롤과 무관하게 항상 보이는 하단 고정 영역.
- 검증: `npm run typecheck` 통과, 별도 포트로 컴파일/200 확인 후 그 서버만 종료.

## 2026-08-25 — 배경음 오브 2단계 실제 앱 적용 (파일 정리 + 기능 코드 작성)

- 사운드 파일 9개를 `public/media/`(한글+긴 크레딧명)에서 `public/media/ambient/`로 이동, 영문 케밥케이스로 rename. 미사용 천둥소리 rain 파일과 `검색어.txt`는 사용자 결정에 따라 `public/media/`에 그대로 둠.
- 풀벌레(cricket) 재생 구간 확정: 파일명 메모("45초부터 잘라야됨")와 이전 결정("45초까지만 사용")이 반대 방향이라 플래그돼 있던 항목 — 사용자에게 다시 물어 **0~45초 구간 사용**으로 최종 확정.
- 신규: `src/types/ambientSound.ts`, `src/data/ambientSounds.ts`, `src/hooks/useAmbientSounds.ts`, `src/components/audio/AmbientOrb.tsx`, `src/components/audio/AmbientOrbLayer.tsx`.
- 수정: `src/components/ui/icons.tsx`(사운드 아이콘 8종 추가), `tailwind.config.ts`(`orb-bob`/`orb-enter` 애니메이션), `src/components/typing/SettingsDrawer.tsx`(배경음 on/off 리스트로 placeholder 대체), `src/components/typing/HealingTypingScreen.tsx`(훅 연결 + 오브 레이어 배치).
- 구현 세부: 연필 0~5초(1.5배 느리게), 책장 넘김 0~10초(2배 느리게), 풀벌레 0~45초는 실제 파일을 자르지 않고 `<audio>`의 timeupdate/ended 이벤트로 구간을 반복 재생. 켜진 사운드의 위치(x·y%)·볼륨은 localStorage(`musicpilsa:ambientSounds`)에 영속화. 오브 인터랙션(안쪽 원 드래그=위치, 바깥 원 가장자리 드래그=볼륨, hover 시 × 삭제)은 목업(`tasks/mockups/sound-orbs-glow-mockup.html`)의 로직을 그대로 React로 포팅.
- 기본값: 처음 방문 시 배경음은 전부 꺼진 상태(목업과 달리 기본 활성 사운드를 두지 않음) — Settings에서 사용자가 직접 켜야 함. 필요시 조정 가능하다고 안내할 것.
- 검증: `npm run typecheck` 통과, 별도 포트(3411)에서 `npm run dev`로 컴파일 200 확인 + `public/media/ambient/`의 9개 파일 모두 200 서빙 확인 후 그 서버만 종료. 단, 드래그/볼륨/오디오 실제 재생 등 화면·소리 인터랙션은 사용자 브라우저 확인 필요(제가 직접 듣거나 마우스 드래그를 할 수 없음).

## 2026-08-26 — 배경음 오브 버그 수정 (드래그/볼륨 안됨 + 화면 밖 배치)

- **버그 1 (드래그·볼륨 조절 전혀 안 됨)**: `AmbientOrbLayer`의 z-index(`6`)가 화면 중앙 타이핑 영역을 감싸는 전체화면 투명 div(`HealingTypingScreen.tsx`, z-index `20`)보다 낮아서, 오브가 눈에는 보여도 클릭/드래그가 그 투명 div에 전부 가로채이고 있었음. `AmbientOrbLayer`를 z-25로 올려 해결. 겸사겸사 오브 드래그 중 halo(볼륨 조절) 핸들러가 같이 반응하지 않도록 pointermove/up에도 `stopPropagation` 추가.
- **버그 2 (화면 밖으로 배치/드래그됨)**: 기존엔 오브 위치(x/y %)를 화면 크기와 무관한 고정 퍼센트(3~97%, 4~96%)로만 clamp하고 있어서, 오브 자체 크기(halo 최대 반지름 105px)를 고려하지 않아 작은 창에서는 그 여백 퍼센트가 실제 오브 절반 크기보다 작아 화면 밖으로 삐져나갔음.
  - 신규 `src/lib/ambient-orb-geometry.ts` — 오브 크기(halo 최소/최대 반지름, 허용오차)를 px 대신 **vmin(뷰포트 최소변) 단위**로 통일하고, `clampAmbientPosition(x, y)`로 "지금 창 크기 기준 안전 여백"을 계산해 위치를 가둠. 여백은 최대 볼륨 기준(HALO_MAX_VMIN)으로 잡아서 나중에 볼륨을 올려도 화면 밖으로 안 나가게 함.
  - `useAmbientSounds.ts` — localStorage 복원/추가(addSound·toggleSound)/드래그(setPosition) 시 전부 이 clamp를 거치도록 통일. **브라우저 창 크기 변경(resize) 리스너 추가** — 창이 작아지면 이미 켜져 있는 오브들의 위치를 다시 계산해 화면 안쪽으로 끌어당김(요청하신 "창 작아지면 위치도 따라 이동" 동작).
  - `AmbientOrb.tsx` — 오브 본체/바깥 원 크기를 고정 px 대신 vmin 기반 `clamp(최소px, N vmin, 최대px)`로 변경 → 창 크기가 바뀌면 오브 자체도 CSS만으로 자동으로 커지고 작아짐. 클릭 판정(halo 가장자리 히트테스트)도 매 포인터 이벤트 시점에 현재 창 크기로 px→vmin 환산해서 시각적 크기와 항상 일치하도록 함.
- 검증: `npm run typecheck` 통과, 개발 서버(포트 3001, 상시 실행 중)가 자동 재컴파일해 200 확인. 실제 드래그/리사이즈 화면 확인은 사용자 브라우저에서 재확인 필요.

## 2026-08-26 — 배경음 오브 여백 과다 문제 수정

- 사용자 피드백: 화면 왼쪽/위쪽에 여백이 과도하게 생김.
- 원인: 직전 수정에서 위치를 화면 안에 가두는 여백을 "최대 볼륨(100%) 기준" 반지름으로 일괄 계산해서, 기본 볼륨(35~60%대)인 오브들까지 가장자리에서 불필요하게 멀리 떨어져 배치되고 있었음.
- 수정: `clampAmbientPosition(x, y, radiusVmin)`이 이제 반지름을 인자로 받아 **그 사운드의 실제 지금 볼륨** 기준으로만 여백을 계산하도록 변경. `useAmbientSounds.ts`의 모든 호출부(복원/추가/드래그/resize)를 각 사운드의 현재 volume 기준으로 갱신. 대신 볼륨을 바꿀 때(`setVolume`)도 새 볼륨 기준으로 위치를 다시 한 번 가둬서, 가장자리 근처에서 볼륨을 올려도 화면 밖으로 삐져나가지 않도록 보완.
- 검증: `npm run typecheck` 통과, 개발 서버 자동 재컴파일 200 확인. 실제 화면에서 여백이 적절해졌는지는 사용자 확인 필요.

## 2026-08-26 — 배경음 오브 화면 안 가두기 기준 재조정 (여백 개념 자체를 변경)

- 사용자 피드백: 여전히 왼쪽/위쪽 여백이 원하는 만큼 좁혀지지 않음. 원하는 동작을 구체적으로 설명: "안쪽 원(드래그 손잡이)이 일부 가려질 때까지는 이동 가능하되, 화면에서 완전히 안 보일 정도로는 이동 안 되게" — 즉 볼륨을 나타내는 바깥 원(halo)은 화면 밖으로 잘려도 상관없고, 오직 드래그로 다시 잡을 수 있는 안쪽 손잡이만 화면 안에 남아있으면 됨.
- 기존엔 화면 밖으로 못 나가는 여백 기준을 "바깥 원(halo) 반지름"(볼륨에 비례, vmin 6~15)으로 잡고 있어서 사용자가 원한 것보다 훨씬 넉넉한 여백이 생기고 있었음.
- 수정: `clampAmbientPosition`의 여백 기준을 halo 반지름에서 **오브 본체(안쪽 원, 드래그 손잡이)의 절반 크기(`ORB_SIZE_VMIN`/2 = 3.5vmin)**로 축소. 볼륨과 무관하게 고정값이라 `useAmbientSounds.ts`의 모든 호출부(복원/추가/드래그/resize/볼륨변경)에서 볼륨을 인자로 넘기던 로직을 제거하고 단순화(`setVolume`도 다시 위치 재계산 없이 볼륨만 갱신하도록 원복).
- 검증: `npm run typecheck` 통과, 개발 서버 자동 재컴파일 200 확인. 이제 오브를 화면 가장자리로 드래그하면 안쪽 원이 절반 정도까지는 가려지되 완전히 사라지진 않아야 함 — 사용자 브라우저 재확인 필요.

## 2026-08-26 — 배경음 오브 좌우/상하 여백 비대칭 문제 진단·수정

- 사용자 피드백: 왼쪽/위쪽은 여전히 간격이 남는데, 오른쪽/아래쪽은 드래그 시 완전히 사라질 정도로 이동됨. 네 방향 모두 동일하길 원함.
- 코드 상 clamp 공식(`clampAmbientPosition`) 자체는 좌/우, 상/하 각각 동일한 여백값을 양쪽에 대칭으로 적용하고 있어 수식 자체엔 비대칭이 없음을 확인.
- 실제 원인으로 추정: 9개 사운드의 기본 위치(`defaultX`/`defaultY`, 목업에서 그대로 가져온 값)가 애초에 비대칭이었음 — 예: 왼쪽 계열은 6~17%(가장자리에서 여유 있음), 오른쪽 계열은 83~93%(이미 가장자리에 거의 붙어 시작). clamp 여백을 손잡이 절반 크기로 줄인 상태에서, 오른쪽/아래쪽처럼 이미 가장자리 근처에서 시작하는 오브는 아주 살짝만 드래그해도 곧장 한계(거의 사라지는 지점)에 도달하는 반면, 왼쪽/위쪽은 원래 여유 있게 시작해서 상대적으로 "아직 간격이 남아있다"는 인상을 준 것으로 판단.
- 수정: `src/data/ambientSounds.ts`의 9개 사운드 기본 위치를 14%~86% 범위 안에서 좌우/상하 대칭이 되도록 재배치(예: sea 8,20→14,22 / rain 90,16→86,18 / fire 6,58→14,62 / cricket 93,62→86,62 / bowl 16,87→22,86 / chimes 84,87→78,86 / boil 50,9→50,14 / pencil 17,42→25,44 / pages 83,44→75,44).
- 부가 수정: `ambient-orb-geometry.ts`의 여백 계산 기준을 `window.innerWidth/innerHeight`(세로 스크롤바 폭까지 포함되는 값)에서 `document.documentElement.clientWidth/clientHeight`(실제 렌더링 영역과 일치)로 변경해 미세한 오차 요인 제거.
- 주의사항(사용자에게 안내 필요): 이미 한 번 켰던 적 있는 사운드는 localStorage에 그때 위치가 저장돼 있어서, 새 기본값이 자동 적용되지 않는다 — 껐다가 다시 켜거나 저장된 값을 지워야 새 기본 위치로 나타남.
- 검증: `npm run typecheck` 통과, 개발 서버 자동 재컴파일 200 확인. 실제 네 방향 드래그 대칭 여부는 사용자 확인 필요.

## 2026-08-26 — 배경음 오브 좌우/상하 비대칭 실제 원인 발견 및 수정 (Playwright로 직접 재현·검증)

- 세 번 연속 추측성 수정이 실패해서, 이번엔 브라우저를 직접 띄워 재현하기로 함. 프로젝트에 없던 Playwright를 스크래치패드에 임시 설치해 헤드리스 브라우저로 오브를 4방향 모두 실제로 드래그해보고 좌표를 측정.
- **측정 결과로 확인한 진짜 원인**: `useAmbientSounds`가 관리하는 논리적 위치(state, localStorage에 저장되는 값)는 처음부터 완벽하게 대칭이었음(좌 2.25% / 우 97.75%, 상 3.5% / 하 96.5% — 정확히 공식대로). 문제는 **화면에 그려지는 픽셀 위치**가 항상 오른쪽 아래로 정확히 140px(=오브 wrap 박스 크기의 절반)씩 밀려서 렌더링되고 있었던 것.
- **근본 원인**: `tailwind.config.ts`의 `orb-enter` 키프레임 애니메이션이 `transform: scale(...)`만 지정하고 있었음. CSS 애니메이션이 `transform`을 건드리면 그 시점의 `transform` 값 전체를 통째로 덮어써버리는데, `AmbientOrb`의 wrap div는 원래 Tailwind 클래스 `-translate-x-1/2 -translate-y-1/2`로 "자기 자신을 x/y% 지점에 중앙 정렬"하고 있었음. `orb-enter` 애니메이션이 마운트 시 실행되면서(그리고 `fill-mode: both`라 애니메이션이 끝난 뒤에도 계속) 그 translate를 통째로 지워버려서, wrap의 **왼쪽 위 모서리**가 x/y% 지점에 위치하는 꼴이 되어 오브 전체가 wrap 크기(280px)의 절반만큼 오른쪽 아래로 밀려 보였던 것. 이게 왜 "왼쪽/위는 여백 있고 오른쪽/아래는 사라짐"으로 보였는지: 전체가 항상 +140px씩 밀려 있으니, 왼쪽/위로 끝까지 드래그해도 실제로는 140px 못 미친 지점에서 멈춘 것처럼 보이고, 오른쪽/아래로는 원래 멈춰야 할 지점보다 140px 더 나가서(=화면 밖으로 완전히) 밀려난 것처럼 보였음.
- **수정**: `orb-enter` 키프레임에 `translate(-50%, -50%)`를 함께 넣어서(`transform: translate(-50%, -50%) scale(...)`) wrap의 중앙 정렬이 애니메이션에 덮어써지지 않도록 함.
- **삽질 원인 추가 발견**: 수정 직후 재검증했을 때도 처음엔 그대로였는데, 원인은 dev 서버가 `tailwind.config.ts` 변경을 제대로 반영하지 못하고 있었던 것(핫 리로드가 아니라 `.next` 캐시 삭제 + 서버 완전 재시작이 필요했음).
- 겸사겸사: 여백 계산에 쓰던 오브 크기(vmin)를 실제 렌더링 크기의 px 상하한(`ORB_SIZE_FLOOR_PX`/`ORB_SIZE_CEILING_PX`, 40~56px)과 정확히 일치하는 공유 상수로 정리해서, 아주 작은 잔여 오차(3.5px 정도)도 제거.
- **검증**: Playwright로 4방향 모두 재드래그 → 좌/우/상/하 gap 전부 0px로 완전히 대칭 확인, 콘솔 에러 없음, 스크린샷으로 눈으로도 확인(오브가 화면 가장자리에 절반 정도 걸친 채 정확히 멈춤). `npm run typecheck` 통과.
- 사용 후 정리: 이번 진단용으로 스크래치패드에 설치한 Playwright는 프로젝트(`package.json`)에는 추가하지 않음 — 임시 진단 도구로만 사용.

## 2026-08-26 — 사용자 최종 확인 완료

- 배경음 오브 드래그/화면 경계 대칭 문제, 사용자가 실제 브라우저에서 재확인 후 "확인했다"고 회신함. 2단계(배경음 오브 기능) 핵심 버그 수정 완료.

## 2026-08-26 — 사이트 타이틀 문구/폰트 개선

- 요청 1: 이름을 설정하면 "나 {이름}에게" → "{이름}에게"로, "나"를 빼고 이름만 남도록 변경.
- 요청 2: Settings에서 고른 폰트 스타일(고딕/명조)이 타이틀에도 적용되도록(글자 크기·굵기는 제외, 서체만).
- `src/components/typing/SiteTitleBar.tsx`: `buildTitle()`이 이름이 있을 때 "나 "를 붙이지 않도록 수정, `titleFontFamily` prop 추가해 타이틀 버튼 텍스트와 편집 팝오버 미리보기 텍스트에 `style={{ fontFamily }}`로 적용.
- `src/components/typing/HealingTypingScreen.tsx`: `useFontSettings()`의 `fontStyle.fontFamily`(폰트 크기/굵기는 빠지고 서체 CSS 변수만 담긴 값)를 `titleFontFamily`로 전달.
- 검증: `npm run typecheck` 통과. Playwright로 직접 확인 — 이름 미입력 시 "나에게 보내는 #위로의 메시지", "화선" 입력 시 "화선에게 보내는 #위로의 메시지"로 정확히 바뀜. Settings에서 "Serif (명조)" 선택 시 타이틀의 computed font-family가 Noto Serif KR로 바뀌는 것도 확인.

## 2026-08-26 — 배경음 오브 도입 후 전반적으로 무거워진 문제(타이핑 중 불필요한 리렌더) 수정

- 사용자 피드백: 사이트가 전체적으로 무거워짐, 특히 뭔가 움직일 때(타이핑 등).
- 원인: `HealingTypingScreen`은 한 글자 입력할 때마다 리렌더되는데, `AmbientOrbLayer`가 `memo` 없이 매번 다시 그려지고, 그 안에서 각 오브에 `(x, y) => onPositionChange(sound.id, x, y)`처럼 **오브마다 매번 새 클로저(함수)를 만들어** 넘기고 있었음. 그 결과 타이핑과 전혀 무관한 배경음 오브들(각각 box-shadow에 `color-mix()`가 들어간 halo/오브 본체 스타일 재계산 포함)까지 글자 하나 칠 때마다 전부 다시 렌더링되고 있었음 — 오브를 여러 개 켜둘수록 타이핑 체감 무게가 늘어나는 구조.
- 수정: `AmbientOrbLayer`와 `AmbientOrb`를 `React.memo`로 감싸고, `AmbientOrbLayer`가 각 오브에 (오브마다 새로 만드는 클로저 대신) **hook에서 내려온 안정된 콜백을 그대로 + `id`만** 전달하도록 변경(`AmbientOrb` 내부에서 `onPositionChange(id, x, y)`처럼 자기 id를 채워서 호출). 이러면 (1) 타이핑처럼 배경음과 무관한 리렌더는 `AmbientOrbLayer` 자체가 `memo`로 통째로 건너뛰고, (2) 오브 하나를 드래그해도 다른 오브들은 props가 그대로라 리렌더되지 않음.
- 검증: `npm run typecheck` 통과. Playwright로 배경음 3개(파도/장작불/풀벌레) 켜둔 상태에서 26글자를 타이핑하며 `MutationObserver`로 오브 DOM을 감시 — **수정 후 타이핑 중 오브 DOM 변경 0건** 확인(콘솔 에러도 없음). 체감 무게가 실제로 줄었는지는 사용자 브라우저에서 재확인 필요.

## 2026-08-26 — 대대적인 미디어 자산 압축(로딩 속도 개선)

- 사용자 피드백: 사이트 진입 시 로딩이 느리고, 배경음을 켤 때도 늦게 나타남. "쓰기 싫어질 정도"라는 강한 피드백 — 근본적인 개선 요청.
- **진단**: `public/media` 전체가 565MB. 배경 영상 17개가 1080p/약 10Mbps(파일당 12~38MB, 화면에서는 어둡게+블러 처리돼 육안 구분이 거의 안 되는데도 고화질 원본 그대로), 오늘 추가한 배경음 9개가 무압축 WAV/FLAC(최대 96kHz/24bit, 파일당 최대 31MB — 풍경 소리 하나가 31MB), 배경음악 mp3 상당수가 320kbps CBR. 로딩이 느린 원인이 코드가 아니라 자산 크기 자체였음.
- **작업**: 이 컴퓨터에 없던 ffmpeg를 winget으로 설치(`Gyan.FFmpeg`, PATH: `~/AppData/Local/Microsoft/WinGet/Links`)해서 실제로 재인코딩.
  - 배경음(ambient) 9개: WAV/FLAC → MP3(libmp3lame, VBR `-q:a 4`). 연필/책장 넘김/풀벌레는 이미 앞부분 몇 초만 쓰고 있었는데 원본 전체를 다운로드하고 있었으므로, 실제 재생 구간(0~5초/0~10초/0~45초)만 잘라서 인코딩 — 안 쓰는 뒷부분 다운로드 낭비도 함께 제거. **144MB → 7MB (95%↓)**. `ambientSounds.ts`의 `src`를 `.mp3`로 갱신, 미리 잘라놓은 파일이라 더는 JS로 구간을 제한할 필요가 없어져 `clipEndSec`을 `null`로 정리(네이티브 `loop`로 매끄럽게 반복).
  - 배경 영상(video) 17개: `libx264 -preset slow -crf 27 -an -movflags +faststart`로 재인코딩(오디오 트랙 자체가 없어 `-an`, 프로그레시브 재생을 위해 faststart). **460MB → 111MB (76%↓)**. 압축 전/후 프레임을 직접 비교 스크린샷으로 확인 — 어둡게+블러 처리되는 배경이라 육안상 화질 차이 거의 없음. (참고: 원본 영상에 "Artlist" 워터마크가 박혀 있는 걸 발견 — 라이선스 관련해 별도 확인 필요해 보임, 오늘 작업 범위 밖이라 손대지 않음.)
  - 배경음악(bgm) 320kbps 6개: VBR `-q:a 1`(~220kbps대)로 재인코딩. 이미 128kbps였던 2개는 손대지 않음. **44MB → 28MB**.
  - `next.config.js`에 `/media/:path*` 대상 `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` 헤더 추가 — 같은 세션 안에서 재방문/새로고침 시 무거운 미디어를 다시 받지 않도록. (immutable로 하지 않은 이유: 파일명에 해시가 없어서 나중에 같은 이름으로 내용을 바꾸면 오래 캐시된 사용자에게 갱신이 안 갈 위험이 있음.)
  - **결과**: `public/media` 총합 **565MB → 194MB**.
- **실측 검증**: Next.js dev 서버는 정적 자산 서빙에 최적화돼 있지 않아 왜곡된 수치가 나와서(웜 리로드도 20초 이상), 실제 배포와 가까운 **프로덕션 빌드**(`npm run build && npm run start`)로 Playwright 실측: 첫 로드 **networkidle 1.57초**, 브라우저 캐시가 있는 재방문 **0.95초**. 콘솔 에러 없음, 영상 정상 재생 확인(스크린샷 첨부 확인).
- **남은 항목(사용자 확인 필요)**: `public/media/(사용안함) 빗소리_뒤에 천둥소리...wav` 파일이 50MB — 코드에서 전혀 참조 안 해서 방문자에게 다운로드되진 않지만(런타임 영향 없음), 배포 용량 자체는 차지함. 이전에 "그대로 둠"으로 결정했었는데, 이번 대청소 겸 삭제할지 다시 여쭤봐야 함.
- typecheck 통과. ffmpeg는 프로젝트 의존성에 추가하지 않고 시스템에 설치된 CLI 도구로만 사용(1회성 자산 전처리 작업).

## 2026-08-26 — 첫 화면 로딩 연출 추가 + 타이핑 전 배경음악/배경음 재생 안 되던 버그 수정

- **사용자 피드백**: 첫 화면 진입 시 요소들이 "두둑두둑" 각자 따로 튀어나오는 게 눈에 보임. 참고로 든 두 스타일(teamevople.kr류 요소별 다방향 순차등장 / typing.works류 프로그레스 바→완료 후 페이드인) 중, "힐링 타이핑"이라는 톤에는 산만한 다방향보다 차분한 통일감이 맞다고 판단해 후자(심플 로딩바 + 완료 후 아래에서 위로 뜨며 페이드인) 방향으로 사용자 승인받아 진행.
- **원인**: 배경 영상만 자기 혼자 `opacity` 트랜지션으로 페이드인하고, 타이틀/문장입력창/버튼줄/하단 컨트롤바는 전환 애니메이션 없이 그냥 즉시 렌더링돼서 서로 타이밍이 안 맞게 나타나고 있었음.
- **신규**: `src/components/loading/LoadingScreen.tsx` — 화면 전체를 덮는 심플한 로딩 화면(중앙 얇은 프로그레스 바). 실제 진행률을 알 수 없어 90%까지는 점점 느려지는 속도로 채우다가, 배경 영상이 준비되면(`videoStatus`가 `loading`을 벗어나면, 기존 3초 타임아웃 로직 그대로 재사용) 100%로 스냅 후 페이드아웃.
- `tailwind.config.ts` — `fade-up-in`(일반 요소용) / `fade-up-in-x`(이미 `-translate-x-1/2`로 가로 중앙정렬된 `AudioController` 하단 바 전용, orb-enter 때와 동일한 이유로 -50% 값을 keyframe 안에 함께 넣어야 애니메이션 종료 후 중앙정렬이 안 풀림) 애니메이션 추가.
- `HealingTypingScreen.tsx` — `isAppReady` 상태(배경 영상 ready/error + 최소 노출시간 550ms) 추가, 로딩 완료 시점부터 타이틀바(0ms)→문장입력창(90ms)→버튼줄(160ms)→하단 컨트롤바(220ms) 순으로 살짝 딜레이 줘서 `fade-up-in` 적용.
- `AudioController.tsx` — `isRevealed`/`revealDelayMs` prop 추가, 기존 `-translate-x-1/2` 중앙정렬을 깨지 않도록 `fade-up-in-x` 전용 애니메이션 적용.
- **겸사겸사 버그 수정(사용자 요청)**: "타이핑을 시작하기 전까지 배경음악도 배경음(오브)도 전혀 재생 안 됨" — 원인은 브라우저 자동재생 정책을 우회하는 재시도 로직(`handleFirstInteraction`)이 타이핑 입력창의 `onInput`(=실제로 글자를 쳐야만 발생)에만 연결돼 있었던 것. 화면 아무 곳이나 클릭하거나 키를 한 번만 눌러도 되는데, 그 경로가 없었음. `HealingTypingScreen.tsx`에 `window`의 `pointerdown`/`keydown`을 캡처 단계로 구독하는 effect 추가 — 페이지 전체에서 가장 먼저 일어나는 사용자 제스처를 잡아 배경음악/배경음을 재생 시도.
- **검증**: `npm run typecheck` 통과. Playwright로 실측 —로딩 화면이 실제로 뜨고(early check) 배경 영상 ready 후 사라짐, 하단 컨트롤바가 애니메이션 종료 후에도 화면 중앙에서 3px 이내 오차로 정확히 정렬(가로 중앙정렬 안 깨짐 확인), 콘솔 에러 없음. 오디오 버그: (1) 클릭만 하고 타이핑은 안 했을 때도 `<audio>`가 재생 상태로 전환됨, (2) 클릭 없이 키보드 타이핑만 했을 때도 재생됨, (3) 아무 상호작용 없을 땐 재생 안 됨(브라우저 정책대로 정상) — 모두 확인.
- 이번에도 진단·검증용 Playwright는 스크래치패드에 임시 설치만 하고 프로젝트(`package.json`)에는 추가하지 않음, 확인 후 개발 서버도 종료함.
- **남은 항목**: 실제 화면에서 애니메이션 느낌(속도/딜레이 간격이 적당한지)과 소리가 정말 원하는 타이밍에 들리는지는 사용자 브라우저에서 직접 확인 필요.
- **배포**: `git push origin main`(`0c1b1b8`) 후 `vercel --prod`로 프로덕션 배포 완료, `musicpilsa.vercel.app` 200 응답 확인.

## 2026-08-27 — 로딩 연출 속도 조정 (사용자 피드백: 너무 빠름)

- **사용자 피드백**: 배포된 사이트를 직접 보고 "로딩바가 너무 빠르게 올라가고 화면도 너무 빠르게 로딩된다"고 지적, shhhh.space·pixelthoughts.co를 참고 레퍼런스로 제시.
- WebFetch로 두 사이트를 확인해보려 했으나 shhhh.space는 403으로 차단, pixelthoughts.co는 HTML→텍스트 변환이라 로딩바/등장 속도 같은 실제 애니메이션 타이밍 정보는 얻지 못함(레퍼런스 사이트의 정확한 수치를 카피한 게 아니라, 사용자가 표현한 "너무 빠름"이라는 방향성 기준으로 값을 조정함 — 이 점 사용자에게 안내 필요).
- **조정한 값**(`LoadingScreen.tsx`/`HealingTypingScreen.tsx`/`tailwind.config.ts`):
  - 로딩 최소 노출 시간(`MIN_LOADING_MS`) 550ms → 2200ms.
  - 로딩바 채워지는 속도: interval당 step 계수 0.08 → 0.025, 최소 step 0.4 → 0.15(급하게 90%까지 안 차오르도록 완만하게).
  - 로딩바 width 트랜지션 300ms → 700ms(막판에 100%로 스냅할 때도 부드럽게), 로딩 화면 페이드아웃(`FADE_OUT_MS`) 400ms → 900ms.
  - 타이틀→문장입력창→버튼줄→하단 컨트롤바 순차 등장 딜레이 0/90/160/220ms → 0/220/420/620ms, `fade-up-in`/`fade-up-in-x` 애니메이션 길이 0.6s → 1s.
- **검증 중 겪은 삽질**: Playwright로 실측하다가 로딩화면이 영원히 안 사라지는 것처럼 보이는 현상을 발견해 원인 조사. 임시로 앱 코드에 `window.__debug`(videoStatus/isAppReady 노출)를 잠깐 추가해 확인해보니 실제로는 `isAppReady`가 설계대로 정확히 ~2.86초에 `true`로 바뀌고 있었음 — **진짜 원인은 검증 스크립트 쪽 버그**: `querySelector('[aria-hidden="true"].fixed.inset-0')`가 매칭 조건을 만족하는 여러 요소 중 첫 번째(로딩 화면이 아니라 `StarfieldBackground`의 `<canvas>`, 이 요소는 원래 항상 `opacity:1`로 계속 떠 있는 게 정상)를 잘못 짚고 있었던 것. 셀렉터를 로딩 화면 전용 클래스(`z-[100]`)로 좁혀서 재검증하니 정상 동작 확인됨. 디버그용으로 넣었던 `window.__debug` 코드는 검증 후 제거.
- **최종 검증**: `npm run typecheck` 통과. 프로덕션 빌드(`next build && next start`, 포트 3450)로 Playwright 실측 — 로딩 화면이 t≈2.75초에 페이드 시작해 0.9초에 걸쳐 매끄럽게(opacity 0.86→0.53→0.34→0.12→0.04→0.01) 사라짐, 이후 요소 4개가 설계한 딜레이(0/220/420/620ms)대로 순차 등장, 콘솔 에러 없음. 스크린샷으로 최종 화면도 확인(정상).
- **배포**: `git push origin main`(`2bf6f3f`) 후 `vercel --prod` 배포, `musicpilsa.vercel.app` 200 확인.

## 2026-08-27 — 타이핑 스파클(파티클) 위치 이탈 버그 발견 및 수정

- **사용자 피드백**: 위 로딩 연출 배포 직후 "타이핑할 때 스파클 위치가 바뀌었다, 롤백해야 될 것 같은데 왜 그게 거기에 영향을 미치는지 모르겠다."
- **원인 조사**: 타이핑 글로우 파티클을 그리는 `CharParticleCanvas`(`position: fixed; inset: 0`)가 `SentenceTypingArea` 안에 있었고, `SentenceTypingArea` 전체가 `HealingTypingScreen`에서 로딩 연출용 `animate-fade-up-in` 클래스가 걸린 `<div>`로 감싸져 있었음. CSS 스펙상 **조상 요소에 `transform`이 적용되면 그 안의 `position: fixed` 자손은 뷰포트가 아니라 그 조상을 기준으로 위치가 잡힌다** — `fade-up-in` 애니메이션은 `fill-mode: both`라 애니메이션이 끝난 뒤에도 keyframe의 마지막 값(`transform: translateY(0)`)이 계속 적용된 채로 남는데, `translateY(0)`도 `none`이 아니라서 이 규칙이 계속 발동함. 그 결과 파티클 캔버스가 뷰포트 전체가 아니라 문장입력창 래퍼 박스 기준으로 위치가 잡혀, `getBoundingClientRect()`로 계산한 글자의 실제 화면 좌표에 파티클을 그려도 캔버스 자체가 엉뚱한 곳에 있어 스파클이 밀려 보였음.
  - Playwright로 실측: 수정 전 파티클 캔버스의 `getBoundingClientRect()`가 `(333, 307)`에서 시작(뷰포트는 `(0,0)`이어야 정상) — 조상(`animate-fade-up-in`)의 `transform: matrix(1,0,0,1,0,0)`(단위행렬이지만 `none`이 아님)이 원인임을 확인.
  - 이 버그는 오늘 조정한 타이밍 값 때문이 아니라, **로딩 연출을 처음 도입한 시점(`0c1b1b8`)부터 있던 구조적 버그** — 문장입력창을 `fade-up-in`으로 감싸면서 그 안에 있던 파티클 캔버스까지 함께 갇힌 것. 그때는 로딩/오디오 확인에 집중하느라 스파클 위치는 별도로 검증하지 않아 놓쳤던 것으로 보임.
- **수정**: `CharParticleCanvas`와 그 핸들(`particleHandleRef`)을 `SentenceTypingArea` 내부에서 `HealingTypingScreen` 최상위(애니메이션 래퍼 밖, `AmbientOrbLayer`와 같은 레벨)로 옮김. `SentenceTypingArea`는 이제 `onGlowStart` 콜백을 prop으로 받아 `TypingChar`에 그대로 전달만 하고, 실제 파티클 생성(`spawnAt`)은 부모가 담당.
- **검증**: `npm run typecheck` 통과. 프로덕션 빌드로 Playwright 실측 — 수정 후 파티클 캔버스가 정확히 `(0,0)`~뷰포트 크기로 잡히고 조상에 transform 없음 확인. 실제 목표 문장("누구에게도 말 못한 마음...")의 앞 4글자를 그대로 타이핑시켜 스크린샷 확인한 결과 스파클이 정확히 "누구에게" 글자 위치에 뜸. 콘솔 에러 없음.
- **배포**: `git push origin main`(`1a7237b`) 후 `vercel --prod` 배포, `musicpilsa.vercel.app` 200 확인.

## 2026-08-27 — 로딩바 색상/등장 연출/기본 폰트 3건 수정

- **사용자 요청 1**: 로딩바 화면의 푸른색 느낌을 걷어내고 블랙 계열로 변경. `LoadingScreen.tsx`의 배경을 `bg-slate-950`(파란기 있는 다크)에서 `bg-black`(순수 블랙)으로 교체.
- **사용자 요청 2**: 로딩 완료 후 UI/텍스트가 아래에서 살짝 떠오르며 순차 페이드인되는 연출 — 기존에 만든 목업(artifact `180fc441-...`, "Glow Orbs")을 참고하라는 요청.
  - 처음엔 그 목업(배경음 오브 기능용)에 로딩/페이드인 관련 코드가 없다고 잘못 판단(검색 키워드를 "fade|reveal|entrance|stagger"로 잡아서 실제 키프레임 이름인 `rise`/`rise-bar`를 놓침). 사용자가 "그 사람과 함께 걷던 골목.. 텍스트가 떠오르며 페이드인되지 않냐"고 정확히 짚어줘서 재확인 — 실제로 `.typing-mock`(rise: `translateY(10px)→0`, `opacity 0→1`, 0.8s, 0.5s 딜레이, ease-out)과 `.controlbar-mock`(rise-bar: `translateY(14px)→0`, 0.7s, 0.65s 딜레이, ease-out) 애니메이션이 정확히 존재함을 확인.
  - `tailwind.config.ts`: `fade-up-in`을 목업의 `rise`와 동일하게(translateY 14px→10px, 커스텀 cubic-bezier→`ease-out`, 1s→0.8s), `fade-up-in-x`를 `rise-bar`와 동일하게(1s→0.7s, ease-out) 조정.
  - `HealingTypingScreen.tsx`: 문장입력창(SentenceTypingArea) 딜레이 220ms→**500ms**(목업의 `.typing-mock` 그대로), 버튼줄 420ms→575ms(목업에 없는 요소라 문장/하단바 사이로 보간), 하단 컨트롤바(AudioController) 620ms→**650ms**(목업의 `.controlbar-mock` 그대로). 타이틀바는 기존대로 딜레이 0.
- **사용자 요청 3**: Serif/Sans-Serif 순서를 서로 스위치하고 기본 폰트를 명조(serif)로 — 최초 진입 사용자가 명조체를 보게.
  - `SettingsDrawer.tsx`의 `FONT_FAMILY_OPTIONS` 배열 순서를 `[sans, serif]` → `[serif, sans]`로 변경(Settings 안 폰트 선택 UI 노출 순서가 이 배열 순서를 그대로 따름).
  - `useFontSettings.ts`의 `DEFAULT_FONT_FAMILY`를 `"sans"` → `"serif"`로 변경 — Settings의 "Reset" 버튼도 같은 상수를 참조해서 자동으로 명조로 리셋되도록 통일됨(별도 처리 불필요).
- **검증**: `npm run typecheck` 통과. 프로덕션 빌드로 Playwright 실측 — 로딩 화면 배경색이 `rgb(0,0,0)`(순수 블랙)인 것 확인, 최초 진입 시 문장 텍스트의 `font-family`가 Noto Serif KR로 렌더링되는 것 확인, Settings 드로어의 폰트 옵션이 "Serif (명조)"가 먼저 뜨는 것 확인. 스크린샷으로 전체적인 화면 톤(블랙 계열)과 명조체 적용도 육안 확인. 콘솔 에러 없음.
- **배포**: `git push origin main`(`4beeaa5`) 후 `vercel --prod` 배포, `musicpilsa.vercel.app` 200 확인.

## 2026-08-27 — 배경음 오브 볼륨 히트존 버그 수정 + 영상/음악 자동재생 조사

- **사용자 요청 1**: 배경음 오브 볼륨이 100%일 때 실제로 보이는 바깥 원(halo)보다 더 큰(바깥의) 지점에서부터 볼륨 조절이 시작되는 문제.
  - **원인**: `radiusVminFromVolume(volume)`(볼륨→반지름 vmin 공식)는 px 상하한을 모르는 순수 계산인데, 실제 화면에 그려지는 바깥 원은 `AmbientOrb.tsx`에서 `clamp(46px, Nvmin, 220px)`로 px 상한이 걸려 있었음. 볼륨이 높고(특히 100%) 창이 충분히 크면(대략 뷰포트 짧은 변 733px 이상 — 데스크톱 대부분) 계산상의 반지름(예: 뷰포트 900px 기준 135px)이 CSS 상한(110px)보다 커져서, 클릭/hover 판정(hit-test)은 여전히 135px 지점을 기준으로 동작하고 있었지만 눈에 보이는 원은 110px에서 잘려 있었던 것 — 그 차이만큼 "보이지 않는 원"에서부터 조절이 시작되는 것처럼 느껴졌음.
  - **수정**: `ambient-orb-geometry.ts`에 `haloVisualRadiusVmin(volume)` 추가 — 볼륨→반지름을 px로 환산한 뒤 AmbientOrb.tsx의 렌더링과 동일한 px 상하한(`HALO_SIZE_FLOOR_PX`/`HALO_SIZE_CEILING_PX`, 이번에 이 파일로 이동해 단일 소스로 통일)으로 클램프하고 다시 vmin으로 되돌리는 함수. `AmbientOrb.tsx`의 히트테스트(`handleHaloPointerDown`/`handleHaloPointerMove`)가 기존의 순수 vmin 반지름 대신 이 함수를 호출하도록 변경 — 시각적 크기 계산(halo CSS)은 건드리지 않고 클릭 판정만 실제 렌더 크기에 맞춤.
  - **검증**: Playwright로 실측 — localStorage에 볼륨 100%짜리 사운드를 미리 심어두고, 실제 렌더된 바깥 원의 반지름(`getBoundingClientRect`)과 옛 버그의 히트존 중심(순수 vmin 계산값)을 각각 계산해 포인터를 이동시켜본 결과: 실제 보이는 원 가장자리(111.8px)에서는 커서가 정확히 반응(`ew-resize`)하고, 옛 버그 지점(135px)에서는 더 이상 반응하지 않음(빈 커서) 확인.
- **사용자 요청 2**: 사이트 진입 시 영상/음악이 타이핑 없이 바로 재생되도록.
  - **조사 결과**: 새 브라우저 컨텍스트(로컬 스토리지·방문 이력 전혀 없는, 진짜 첫 방문자와 동일한 조건)로 Playwright 실측한 결과, **영상은 이미 어떤 상호작용도 없이 자동재생되고 있음**(5초+ 경과 후에도 `paused: false`, `currentTime` 계속 증가) — 코드 수정 불필요.
  - **음악(배경음악)**은 브라우저의 자동재생 정책상 사용자의 첫 제스처(클릭/키 입력 등) 없이는 어떤 코드로도 재생을 보장할 수 없음(이 사이트만의 제약이 아니라 모든 브라우저의 공통 규칙). 현재 구현(화면 아무 곳이나 클릭하거나 키를 한 번만 눌러도 즉시 재생, `HealingTypingScreen.tsx`의 전역 `pointerdown`/`keydown` 리스너)이 이 제약 안에서 가능한 최선 — 별도 수정 없음.
  - 사용자가 "배경효과음은 지 혼자 재생되던데?"라고 지적한 부분은, `useAmbientSounds.ts`가 localStorage에 복원된 사운드를 게이트 없이 즉시 `audio.play()` 시도하기 때문(94번째 줄 근처) — 정상적인 첫 방문자라면 이것도 막혀야 하지만, hwasun님 브라우저는 이 사이트를 여러 번 테스트하며 방문한 이력이 쌓여 크롬의 Media Engagement Index가 높아진 상태라 자동재생이 예외적으로 허용된 것으로 추정(개인 브라우저에만 주어지는 신뢰도 특전이지, 코드가 제약을 우회한 게 아님). 시크릿 창이나 실제 첫 방문자 기준으로는 동일하게 막힘.
- **검증**: `npm run typecheck` 통과, 프로덕션 빌드로 위 Playwright 실측 전부 확인. 콘솔 에러 없음.
- **배포**: `git push origin main`(`7dadfed`) 후 `vercel --prod` 배포, `musicpilsa.vercel.app` 200 확인.
- **사용자 피드백**: "배포사이트 주소 항상 같이 줘 — 이것만 작업하는 게 아니라서" → 이후로 배포 완료 안내에는 항상 URL을 명시하기로(메모리에도 기록).

## 2026-08-27 — 배경음 오브 유영 효과 강화 + 사이트 타이틀 진하게/위치 조정

- **사용자 요청 1**: 배경음 오브가 둥둥 떠 있거나 돌아다니는 느낌이면 좋겠다("일단 둥둥뜨게라도"), 속도(성능)에 치명적인지 확인해달라는 요청.
  - 원래도 `orb-bob` CSS 애니메이션(순수 `transform: translateY + rotate`, GPU 컴포지팅, JS 관여 없음)이 이미 있어서 성능 영향은 원래도 지금도 사실상 없음 — 다만 진폭이 9px로 작고 모든 오브가 완전히 같은 위상으로 움직여서 잘 안 느껴졌던 것으로 판단.
  - `tailwind.config.ts`: `orb-bob` 키프레임을 단순 상하 왕복에서 25/50/75% 지점에 좌우 드리프트를 섞어 살짝 원을 그리듯 움직이도록 확장(진폭도 9px→최대 16px로 소폭 확대).
  - `AmbientOrb.tsx`: 사운드 `id` 문자열을 시드로 오브마다 다른 `animationDelay`(0~3.9s)·`animationDuration`(7~11s)를 부여(useMemo) — 여러 개를 켜도 서로 다른 박자로 유영하는 것처럼 보이게 함. 기존엔 위치 드래그 중(`isDraggingOrb`)에만 흔들림을 멈췄는데, 볼륨 드래그 중(`haloState === "grabbed"`)에도 멈추도록 범위를 넓힘 — 흔들리는 상태에서 볼륨을 조절하면 히트테스트가 기준으로 삼는 정지된 중심과 실제 시각적 위치가 어긋나 조작감이 흔들릴 수 있어서.
  - **검증**: Playwright로 사운드 2개를 동시에 켜고 0.6초 간격으로 6번 `transform` matrix를 샘플링한 결과, 두 오브가 매 시점마다 서로 다른 값으로 움직이는 것(디싱크) 확인. 스크린샷으로 육안 확인, 콘솔 에러 없음.
- **사용자 요청 2**: "상단 타이틀이 너무 흐려졌다, 언제부터 이랬지? 진하게 다시 바꿔주고, 너무 상단에 붙어있어서 안 보이니 위치도 조정해달라."
  - **원인 조사**: git log로 `SiteTitleBar.tsx`의 `text-white/60`(투명도) 클래스 자체는 두 커밋(9c1b068, 83fd707) 모두에서 값이 바뀐 적이 없음을 확인 — 대신 오늘 세션 초반에 기본 폰트를 명조(세리프)로 바꾼 변경(`4beeaa5`) 때문에, 타이틀에 적용되는 `titleFontFamily`가 고딕(Pretendard)에서 Noto Serif KR로 바뀌면서 세리프 특유의 가는 획 때문에 같은 투명도에서도 더 흐리게 보이게 된 것으로 판단(색상 자체는 안 바뀜, 인지적으로만 흐려 보임).
  - **수정**: `SiteTitleBar.tsx` — 텍스트 투명도 `text-white/60` → `text-white/85`(hover 시 `hover:text-white`로 완전 불투명), 위치 `fixed ... top-8`(32px) → `top-20`(80px)로 내려서 화면 최상단 가장자리에 덜 붙어 보이도록 조정.
  - **검증**: Playwright로 실측 — 타이틀 버튼의 실제 `color`가 `rgba(255, 255, 255, 0.85)`, `top`이 80px인 것 확인.
- **검증**: `npm run typecheck` 통과, 프로덕션 빌드로 위 Playwright 실측 전부 확인. 콘솔 에러 없음.
- **배포**: `git push origin main`(`1936e5e`) 후 `vercel --prod` 배포, `musicpilsa.vercel.app` 200 확인.

## 2026-08-27 — 타이틀 재조정 + 배경음 볼륨 조절 구간 균일화

- **사용자 요청 1**: "타이틀 조금 더 진하게, 조금 더 아래로" — 직전 조정(투명도 0.6→0.85, top-8→top-20)으로도 부족하다는 추가 피드백.
  - `SiteTitleBar.tsx`: 투명도 `text-white/85` → `text-white`(완전 불투명, hover 시엔 반대로 `/80`으로 살짝 옅어지게 해서 "편집 가능" 어포던스는 유지), 위치 `top-20`(80px) → `top-28`(112px).
- **사용자 요청 2**: "효과음 볼륨 조절 시에 0~50%보다 50~100%가 너무 좁게 느껴지는데 간격 균일하게 조정."
  - **원인**: 바깥 원(halo)의 볼륨→반지름 공식(`radiusVminFromVolume`)은 순수 vmin 선형 공식인데, 실제 렌더링은 `AmbientOrb.tsx`의 `clamp(46px, Nvmin, 220px)`로 px 상한이 걸려 있음. 데스크톱 대부분의 화면(뷰포트 짧은 변 733px 이상)에서는 이 순수 공식이 볼륨 약 76% 지점에서 이미 px 상한(220px)에 도달해버려서, **볼륨 76~100% 구간은 아무리 드래그해도 원 크기가 전혀 안 변하는 "먹통 구간"**이었음. 지난 회차에 히트테스트(클릭 판정 시작 지점)만 이 상한을 반영하도록 고쳤을 뿐, 정작 "드래그 중 포인터 거리→볼륨값" 변환은 여전히 순수 vmin 공식(`volumeFromRadiusVmin`)을 쓰고 있어서, 이 사이의 간극(사용자 입장에서는 원이 안 커지는데 계속 드래그해야 100%에 도달하는 구간)이 "50~100%가 유독 좁다"는 체감으로 이어진 것.
  - **수정**: `ambient-orb-geometry.ts` — `haloVisualRadiusVmin(0)`과 `haloVisualRadiusVmin(1)`로 "지금 이 화면에서 바깥 원이 실제로 그려질 수 있는 최소~최대 반지름"(px 상한까지 반영)을 구하는 `haloBoundsVmin()`을 추가하고, 그 두 값 사이를 볼륨 0~100%에 다시 선형으로 매핑하는 `haloDisplayRadiusVmin(volume)`/`volumeFromHaloRadiusVmin(radiusVmin)`을 새로 만듦. `AmbientOrb.tsx`의 렌더링 크기 계산·히트테스트·드래그 중 볼륨 계산을 전부 이 새 함수로 통일(기존의 순수 vmin 공식 `volumeFromRadiusVmin`은 더 이상 쓰는 곳이 없어져 삭제).
  - **검증**: Playwright로 볼륨 0/25/50/75/100%짜리 사운드 5개를 동시에 띄우고 실제 렌더된 halo 반지름을 측정 — **29.34 / 50.31 / 70.6 / 91.43 / 112.08px, 25%씩 늘어날 때마다 약 20.3~21.0px씩 균일하게 증가**(수정 전이었다면 75→100% 구간 델타가 거의 0에 가까웠을 것). 스크린샷으로 5개 원이 계단식으로 고르게 커지는 것 육안 확인. 콘솔 에러 없음.
- **검증**: `npm run typecheck` 통과, 프로덕션 빌드로 위 Playwright 실측 전부 확인.
- **배포**: 커밋 예정, `git push origin main` 후 `vercel --prod` 배포.
