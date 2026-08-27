# 오늘 할 일

## 진행 중 — 로딩 연출 속도 조정 (사용자 피드백: 너무 빠름, shhhh.space/pixelthoughts.co 참고)

- [x] 사용자 피드백 반영: 로딩바가 너무 빠르게 차고, 화면도 너무 빠르게 로딩되는 느낌 → 전체적으로 느리고 차분하게 조정.
  - 로딩 최소 노출 시간 0.55초 → 2.2초, 로딩바 페이드아웃 0.4초 → 0.9초, 로딩바 채워지는 속도 자체도 완만하게.
  - 타이틀→문장창→버튼→하단바 순차 등장 딜레이 90/160/220ms → 220/420/620ms, 페이드인 애니메이션 길이 0.6초 → 1초.
- [x] `npm run typecheck` 통과. 프로덕션 빌드(`next build && next start`)로 Playwright 실측 — 로딩화면 정확히 ~2.75초 시점에 나타났다 0.9초에 걸쳐 부드럽게 페이드아웃, 요소 4개가 설계한 딜레이대로 순차 페이드인, 콘솔 에러 없음.
  - (참고: WebFetch로는 shhhh.space/pixelthoughts.co의 실제 로딩 애니메이션 느낌은 확인 불가 — shhhh.space는 403, pixelthoughts.co는 텍스트만 추출돼 인트로 타이밍 정보 없음. 사용자 피드백 문구("너무 빠름")를 기준으로 타이밍값을 늦추는 방향으로 조정함.)
- [x] 로딩 속도 조정 배포(`2bf6f3f`) 후 확인 요청.
- [x] **버그 발견 및 수정**: 로딩 연출 배포 후 "타이핑 시 스파클 위치가 바뀌었다"는 피드백. 원인은 타이핑 파티클 캔버스(`position: fixed`)가 `fade-up-in` 애니메이션이 걸린 조상 안에 있었던 것 — CSS 스펙상 조상에 `transform`이 있으면(애니메이션 종료 후에도 `fill-mode: both`로 `translateY(0)`가 남아있어도 해당) `fixed` 자손은 뷰포트가 아니라 그 조상 기준으로 위치가 잡힘. 캔버스를 애니메이션 래퍼 밖(HealingTypingScreen 최상위)으로 옮겨서 해결. 상세는 `tasks/progress.md` 2026-08-27 항목 참고.
- [x] 사용자 확인: 스파클 위치는 고쳐졌으나 3가지 추가 수정 요청 — 로딩바 블랙 계열로, 로딩 완료 후 텍스트 페이드업 연출을 기존 목업(Glow Orbs) 참고해서 다듬기, serif/sans 순서 스위치 + 기본 폰트 명조로.
- [x] 로딩 화면 배경 `bg-slate-950`(푸른기) → `bg-black`.
- [x] 목업(`tasks/mockups/sound-orbs-glow-mockup.html`)의 `.typing-mock`(rise: translateY 10px→0, 0.8s, 0.5s 딜레이, ease-out)·`.controlbar-mock`(rise-bar: translateY 14px→0, 0.7s, 0.65s 딜레이, ease-out) 애니메이션 값을 그대로 가져와 `fade-up-in`/`fade-up-in-x` 갱신, 문장창/하단바 딜레이를 500ms/650ms로 맞춤.
- [x] `SettingsDrawer.tsx`의 `FONT_FAMILY_OPTIONS` 순서를 [serif, sans]로 스위치, `useFontSettings.ts`의 `DEFAULT_FONT_FAMILY`를 `"serif"`로 변경 — 최초 진입 시 명조체로 보임(Reset 버튼도 동일하게 명조로 리셋됨).
- [ ] **사용자 브라우저 확인 필요**: 배포 후 실제 사이트에서 위 3가지가 원하는 느낌대로 반영됐는지 확인.

## 완료 (지난 회차, 배포됨)

- 첫 화면 로딩 연출 최초 도입 + 타이핑 전 배경음악/배경음 재생 안 되던 버그 수정 (`0c1b1b8`) — 사용자가 "로딩이 너무 빠르다"고 피드백해서 위 항목으로 이어짐.

## 완료 (지난 회차, 배포됨)

- 배경 영상 끊김 개선, 배경음 오브 볼륨 조절 UX 개선 — 상세 `tasks/progress.md` 2026-08-26 항목 참고.
- 배경음 오브(사운드 오브) 9종 + Settings 드로어 — 배포 완료.
- 미디어 자산 대대적 압축(565MB→194MB) — 배포 완료.

## 보류 중인 미확정 항목 (사용자 결정: 지금은 건드리지 않음)

- `public/media/(사용안함) 빗소리...wav`(50MB, 코드 미참조) 삭제 여부 → 그대로 둔다.
- `public/media/검색어.txt` 삭제 여부 → 그대로 둔다.
