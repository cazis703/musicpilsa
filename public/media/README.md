# 로컬 배경 미디어 파일 배치 안내

이 앱은 `src/lib/media-paths.ts`의 `VIDEO_PATHS` / `AUDIO_PATHS`에 등록된 경로의
파일을 배경 영상/음악으로 무작위 재생합니다. 파일이 없어도 앱은 정상 동작하며,
다크 배경 + 안내 문구로 대체됩니다.

- 배경 영상: `public/media/video/*.mp4`
- 배경 음악: `public/media/audio/*.mp3`

새 파일을 추가하려면 해당 폴더에 파일을 넣은 뒤, `src/lib/media-paths.ts`의
`VIDEO_PATHS`(영상) 또는 `AUDIO_PATHS` + `AUDIO_TRACK_META`(음악, 제목/아티스트 표기)에
경로를 등록해야 실제로 재생 목록에 반영됩니다.
