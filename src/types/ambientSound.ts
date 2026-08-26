export type AmbientSoundId = "sea" | "rain" | "fire" | "cricket" | "bowl" | "chimes" | "boil" | "pencil" | "pages";

export interface AmbientSoundMeta {
  id: AmbientSoundId;
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
  accent: string;
  src: string;
  defaultX: number; // % (좌측 기준)
  defaultY: number; // % (상단 기준)
  defaultVolume: number; // 0~1
  clipStartSec: number;
  clipEndSec: number | null; // null이면 파일 끝까지 재생
  playbackRate: number;
}

export interface AmbientSoundPosition {
  x: number;
  y: number;
  volume: number;
}

// 화면에 떠 있는(=켜진) 사운드만 키로 존재한다. 없는 id는 꺼진 상태.
export type AmbientSoundPositions = Partial<Record<AmbientSoundId, AmbientSoundPosition>>;
