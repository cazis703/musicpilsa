export type KeySwitchType = "blue" | "blueHeavy" | "brown" | "red" | "silentRed";

export interface KeySwitchMeta {
  id: KeySwitchType;
  label: string;
  src: string;
}

// 기계식 키보드 스위치 타입별 타건음. 각 wav는 스위치 특성(클릭감/저음 바디/볼륨)에 맞춰
// 합성됐다 — 청축(밝고 또렷한 클릭) > 갈축(균형) > 적축(부드러운 리니어) > 저소음 적축(먹먹함).
export const KEY_SWITCH_OPTIONS: KeySwitchMeta[] = [
  { id: "blue", label: "청축1", src: "/media/sfx/key-tap-blue.wav" },
  { id: "blueHeavy", label: "청축2", src: "/media/sfx/key-tap-blue-heavy.wav" },
  { id: "brown", label: "갈축", src: "/media/sfx/key-tap-brown.wav" },
  { id: "red", label: "적축", src: "/media/sfx/key-tap-red.wav" },
  { id: "silentRed", label: "저소음 적축", src: "/media/sfx/key-tap-silent-red.wav" },
];

export const DEFAULT_KEY_SWITCH: KeySwitchType = "brown";

export function getKeySwitchSrc(type: KeySwitchType): string {
  return KEY_SWITCH_OPTIONS.find((option) => option.id === type)?.src ?? KEY_SWITCH_OPTIONS[0].src;
}
