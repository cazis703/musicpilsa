"use client";

import VolumeSlider from "@/components/audio/VolumeSlider";
import { AMBIENT_SOUNDS } from "@/data/ambientSounds";
import type { AmbientSoundId, AmbientSoundPositions } from "@/types/ambientSound";

interface AmbientSoundPickerProps {
  positions: AmbientSoundPositions;
  onToggle: (id: AmbientSoundId) => void;
  onVolumeChange: (id: AmbientSoundId, volume: number) => void;
  className?: string;
}

// 배경음 켜기/끄기 + 개별 볼륨 조절 목록. 켜져 있을 때는 스위치 UI 대신 우측에 볼륨
// 슬라이더를 보여준다 — 아이콘/라벨을 누르면 켜고 끄고, 켜진 동안은 슬라이더로 그 소리의
// 볼륨만 조절한다. 하단 바의 배경음 드롭다운과 Settings 패널 양쪽에서 동일하게 쓰인다.
export default function AmbientSoundPicker({
  positions,
  onToggle,
  onVolumeChange,
  className,
}: AmbientSoundPickerProps) {
  return (
    <ul className={`flex flex-col gap-0.5 ${className ?? ""}`}>
      {AMBIENT_SOUNDS.map((sound) => {
        const active = positions[sound.id];
        const isOn = Boolean(active);
        const Icon = sound.icon;
        return (
          <li key={sound.id}>
            <div className="flex w-full items-center gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-white/5">
              {/* 아이콘부터 라벨까지(슬라이더 제외) 전체를 하나의 클릭 영역으로 묶는다 —
                  아이콘/글자 사이 여백을 눌러도 켜고 꺼지게. */}
              <button
                type="button"
                onClick={() => onToggle(sound.id)}
                aria-pressed={isOn}
                aria-label={`${sound.label} ${isOn ? "끄기" : "켜기"}`}
                className="group flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors"
                  style={
                    isOn
                      ? {
                          borderColor: sound.accent,
                          color: sound.accent,
                          background: `color-mix(in srgb, ${sound.accent} 18%, transparent)`,
                        }
                      : { borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span
                  className={`truncate text-xs transition-colors ${
                    isOn ? "text-white" : "text-white/50 group-hover:text-white/70"
                  }`}
                >
                  {sound.label}
                </span>
              </button>
              {isOn && (
                <VolumeSlider
                  value={active!.volume}
                  onChange={(volume) => onVolumeChange(sound.id, volume)}
                  ariaLabel={`${sound.label} 볼륨`}
                  className="ml-auto w-20 shrink-0"
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
