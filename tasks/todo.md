# 오늘 할 일

## ✅ 완료 — Glow Orbs(사운드 오브) + Settings 드로어 목업 확정
- `tasks/mockups/sound-orbs-glow-mockup.html` / Artifact로 확정 완료. 상세 내용은 `tasks/progress.md` 참고.

## 다음 단계 — 실제 앱(`src/`)에 적용 (승인 후 실행 예정, 아직 코드 변경 없음)

큰 작업이라 2단계로 나눠서 진행합니다. **1단계를 끝내고 브라우저로 확인받은 뒤 2단계로 넘어갑니다.**

### 1단계 — 기존 UI 재배치 (신규 오디오 자산 없이, 구조만 정리) — ✅ 코드 작성 완료, 사용자 브라우저 확인 대기

- [x] `src/components/typing/SettingsDrawer.tsx` (신규) — 우측 슬라이드 패널. 7개 섹션(문장Set+톤/사이트타이틀/배경/음악볼륨/타이핑음/폰트/배경음-placeholder) 작성 완료.
- [x] `src/components/audio/AudioController.tsx` 수정 — `FontSettingsPanel` 제거, 맨 끝에 ⚙ 설정 버튼 추가. `useAudioControls` 훅은 `HealingTypingScreen`으로 끌어올림(SettingsDrawer와 값 공유 위해). 배경바꾸기/음악재생/타이핑음은 그대로 유지.
- [x] `src/components/typing/FontSettingsPanel.tsx` 삭제 (내용은 SettingsDrawer 안에 인라인으로 재작성, 톤 부분은 문장 Set 섹션으로 이동).
- [x] `src/components/ui/icons.tsx` — `SettingsIcon` 추가 (`CloseIcon`은 이미 있었음).
- [x] `src/components/typing/ThemeSwitcher.tsx` — `getSetIcon` export로 변경 (SettingsDrawer에서 재사용).
- [x] `src/components/typing/HealingTypingScreen.tsx` — SettingsDrawer 열림 상태 추가, 렌더링에 조립.
- [x] `npm run typecheck` 통과, `npm run dev` 컴파일/200 응답 확인 완료.
- [x] **사용자 브라우저 확인 완료** — 커밋됨(`5b6d999`).

### 2단계 — 배경음 오브 신규 기능 — ✅ 코드 작성 완료, 사용자 브라우저 확인 대기

- [x] 사운드 파일 정리: `public/media/`의 9개 파일을 `public/media/ambient/`로 이동, 영문 케밥케이스로 rename(`ocean-waves.wav`, `gentle-rain.wav`, `campfire-crackle.flac`, `crickets-night.wav`, `singing-bowl.wav`, `wind-chimes.wav`, `boiling-water.wav`, `pencil-writing.wav`, `page-flipping.wav`). 미사용 천둥소리 rain 파일과 `검색어.txt`는 `public/media/`에 그대로 둠(사용자 확인).
  - 풀벌레(cricket) 재생 구간은 사용자가 실제로 들어보고 **0~45초**로 확정(파일명 메모 "45초부터 잘라야됨"과는 반대 방향이었음 — 확인 완료).
- [x] `src/types/ambientSound.ts` (신규) — `AmbientSoundId`/`AmbientSoundMeta`(icon/accent/src/기본 x·y%/기본 볼륨/재생구간/playbackRate)/`AmbientSoundPositions`.
- [x] `src/data/ambientSounds.ts` (신규) — 9개 사운드 정의. 연필 0~5초(playbackRate 1/1.5), 책장 0~10초(playbackRate 0.5), 풀벌레 0~45초(playbackRate 1).
- [x] `src/components/ui/icons.tsx` — `WaveIcon`/`RainDropIcon`/`FlameIcon`/`CricketIcon`/`SingingBowlIcon`/`WindChimesIcon`/`BubblesIcon`/`PageFlipIcon` 추가(연필은 기존 `PencilIcon` 재사용).
- [x] `src/hooks/useAmbientSounds.ts` (신규) — 켜진 사운드(x·y%·볼륨) 상태 + localStorage 영속화(`musicpilsa:ambientSounds`) + `<audio>` 엘리먼트 생성/정리, 재생구간 있는 사운드는 timeupdate/ended로 구간 반복, `resumeAll()`로 자동재생 차단 시 첫 인터랙션에 재시도.
- [x] `src/components/audio/AmbientOrb.tsx` + `AmbientOrbLayer.tsx` (신규) — 안쪽 원 드래그(위치)/바깥 원 가장자리 드래그(볼륨)/hover 시 밝아지는 어포던스/hover 시 × 삭제 버튼, 목업 그대로 포팅.
- [x] `tailwind.config.ts` — `orb-bob`(떠다니는 애니메이션)/`orb-enter`(등장 애니메이션) keyframes 추가.
- [x] `SettingsDrawer.tsx`의 "배경음" 섹션 — 9개 사운드 on/off 스위치 리스트로 채움(아이콘 칩 + 이름 + 토글 스위치, accent 컬러 반영).
- [x] `HealingTypingScreen.tsx`에 `useAmbientSounds` 훅 연결 + `<AmbientOrbLayer/>` 배치 + Settings 배경음 토글에 클릭음 연결.
- [x] `npm run typecheck` 통과, `npm run dev`(별도 포트)로 컴파일 200 확인 + `public/media/ambient/`의 9개 파일 모두 200으로 서빙 확인.
- [ ] **사용자 브라우저 확인 필요**: Settings에서 배경음 켜기/끄기 → 화면에 오브가 뜨는지, 안쪽 원 드래그로 위치 이동, 바깥 원 가장자리 드래그로 볼륨 조절(소리 크기 변화 포함 — 오디오는 제가 들을 수 없음), hover 시 × 버튼으로 삭제, 새로고침 후 켜둔 상태/위치/볼륨이 유지되는지, 풀벌레/연필/책장 넘김이 짧은 구간만 반복되는지.

## 진행 방식
- 1단계 완료·커밋됨. 2단계 코드 작성 완료, 브라우저 확인 대기 중.
- 확인 후 이상 없으면 커밋 여부를 여쭤보고 진행합니다.
