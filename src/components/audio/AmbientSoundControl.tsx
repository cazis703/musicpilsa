"use client";

import { useEffect, useRef, useState } from "react";
import AmbientSoundPicker from "@/components/audio/AmbientSoundPicker";
import { ChevronDownIcon } from "@/components/ui/icons";
import { AMBIENT_SOUNDS } from "@/data/ambientSounds";
import type { AmbientSoundId, AmbientSoundPositions } from "@/types/ambientSound";

interface AmbientSoundControlProps {
  positions: AmbientSoundPositions;
  onToggle: (id: AmbientSoundId) => void;
  onVolumeChange: (id: AmbientSoundId, volume: number) => void;
}

// 겹쳐 쌓아 보여줄 아이콘 최대 개수. 그보다 많이 켜져 있어도 아이콘은 이만큼만 쌓고
// 나머지는 옆의 "N개 적용 중" 텍스트로만 알려준다.
const MAX_STACK_ICONS = 3;

// SfxTypeDropdown(타건음 종류)과 같은 펼침/바깥클릭·Esc 닫힘 동작을 쓰지만, 트리거 자체는
// 단일 선택 라벨이 아니라 "켜진 배경음이 몇 개인지"를 보여주는 형태라 별도 컴포넌트로 둔다.
export default function AmbientSoundControl({ positions, onToggle, onVolumeChange }: AmbientSoundControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSounds = AMBIENT_SOUNDS.filter((sound) => positions[sound.id]);
  const stackSounds = activeSounds.slice(0, MAX_STACK_ICONS);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="group relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={
          activeSounds.length === 0
            ? "배경음 설정 (눌러서 추가)"
            : `배경음 설정: ${activeSounds.length}개 적용 중 (눌러서 변경)`
        }
        className="flex items-center gap-1.5 whitespace-nowrap text-xs text-white/60 transition-colors hover:text-white"
      >
        {activeSounds.length === 0 ? (
          <span>배경음</span>
        ) : (
          <>
            <span className="flex items-center" aria-hidden="true">
              {stackSounds.map((sound, index) => {
                const Icon = sound.icon;
                return (
                  <span
                    key={sound.id}
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-black/60 bg-black/70"
                    style={{
                      color: sound.accent,
                      marginLeft: index === 0 ? 0 : -7,
                      zIndex: stackSounds.length - index,
                    }}
                  >
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                );
              })}
            </span>
            <span>{activeSounds.length}개 적용 중</span>
          </>
        )}
        <ChevronDownIcon
          className={`h-3 w-3 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {!isOpen && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 origin-bottom -translate-x-1/2 scale-75 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[10px] text-white/80 opacity-0 transition-all duration-150 ease-out group-hover:scale-100 group-hover:opacity-100"
        >
          배경음
        </span>
      )}

      {/* 조건부로 마운트/언마운트하지 않고 항상 DOM에 두되 opacity/transform으로만
          접었다 펼친다 — 그래야 처음 열릴 때도 브라우저가 "닫힌 상태"를 이미 그려둔
          진짜 이전 프레임을 갖고 있어서 트랜지션이 확실히 재생된다. */}
      <div
        aria-label="배경음 설정"
        aria-hidden={!isOpen}
        className={`absolute bottom-full left-1/2 z-50 mb-2 w-64 origin-bottom -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur transition-[opacity,transform] duration-200 ease-out ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-wide text-white/40">배경음</div>
        <div className="px-2 pb-2">
          <AmbientSoundPicker positions={positions} onToggle={onToggle} onVolumeChange={onVolumeChange} />
        </div>
      </div>
    </div>
  );
}
