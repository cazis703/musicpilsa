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
- [ ] **사용자 브라우저 확인 필요**: ⚙ 클릭 → 드로어 슬라이드, 각 섹션 값 변경이 실제로 반영되는지(볼륨/타건음/폰트/문장Set/타이틀), 화면이 안 가려지는지, 바깥 컨트롤(문장Set 드롭다운/타이틀 표시)과 값이 계속 맞게 동작하는지.

### 2단계 — 배경음 오브 신규 기능

- [ ] 사운드 파일 정리: `public/media/` 에 있는 9개 파일(한글+긴 크레딧명)을 `public/media/ambient/`로 이동, 영문 케밥케이스로 정리. `검색어.txt`는 삭제 또는 `tasks/`로 이동 (사용자 확인).
  - 빗소리는 `gentle-rain` 파일만 사용, 천둥/캐럴 섞인 파일은 미사용.
- [ ] `src/types/ambientSound.ts` (신규) — id/label/icon/accent/filePath/기본 x·y%/기본 볼륨/재생구간(start~end초)/playbackRate.
- [ ] `src/data/ambientSounds.ts` (신규) — 9개 사운드 정의.
  - 연필: 0~5초 구간, 1.5배 느리게(playbackRate 0.667)
  - 책장 넘김: 0~10초 구간, 2배 느리게(playbackRate 0.5)
  - 풀벌레: **0~45초 구간** ⚠️ 원본 파일명 메모("45초부터 잘라야됨")와 반대 방향이라 실제 파일 들어보고 재확인 필요
- [ ] `src/components/ui/icons.tsx` — 파도/빗방울/불꽃/풀잎/싱잉볼/풍경/거품/연필/책장 아이콘 추가.
- [ ] `src/hooks/useAmbientSounds.ts` (신규) — 켜진 사운드 목록(추가/삭제), 각 위치(x·y%)·볼륨 상태, localStorage 영속화, `<audio loop>` 엘리먼트 재생/정지/볼륨/구간반복/playbackRate 제어.
- [ ] `src/components/audio/AmbientOrbLayer.tsx` + `AmbientOrb.tsx` (신규) — 목업의 드래그(위치)/halo 드래그(볼륨)/hover 어포던스/× 삭제 인터랙션을 React로 포팅.
- [ ] `SettingsDrawer.tsx`의 "배경음 추가·삭제" 섹션 채우기 — 목업의 on/off 스위치 리스트 로직 연결.
- [ ] `HealingTypingScreen.tsx`에 `<AmbientOrbLayer/>` 배치.
- [ ] 검증: typecheck, 브라우저에서 오브 추가/삭제/드래그/볼륨/새로고침 후 유지 여부 확인 (사용자 확인 필요 — 오디오 재생은 제가 들을 수 없음).

## 진행 방식
- 1단계 코드 변경 후 → 브라우저 확인 요청 → OK 받으면 커밋 여부 확인 → 2단계 시작.
- 큰 작업이라 한 파일씩 보여드리면서 진행합니다.
