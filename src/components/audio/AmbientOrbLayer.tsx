"use client";

import { memo } from "react";
import AmbientOrb from "@/components/audio/AmbientOrb";
import { AMBIENT_SOUNDS } from "@/data/ambientSounds";
import type { AmbientSoundId, AmbientSoundPositions } from "@/types/ambientSound";

interface AmbientOrbLayerProps {
  positions: AmbientSoundPositions;
  onPositionChange: (id: AmbientSoundId, x: number, y: number) => void;
  onVolumeChange: (id: AmbientSoundId, volume: number) => void;
  onRemove: (id: AmbientSoundId) => void;
}

// 화면 전체(inset:0)를 덮는 투명 레이어. 레이어 자신은 pointer-events: none으로 두고,
// 실제 오브가 있는 자리(AmbientOrb 내부)만 pointer-events: auto로 되돌려 그 안에서만
// 클릭/드래그를 받는다 — 오브가 없는 자리(타이핑창, 하단 컨트롤바 등)의 클릭을 가로채지 않기 위함.
//
// memo + (아래) 콜백을 sound별로 새로 만들지 않고 그대로 전달하는 두 가지를 같이 해야
// 효과가 있다 — HealingTypingScreen은 한 글자 칠 때마다 리렌더되는데, 이 컴포넌트의 props
// (positions/onPositionChange/onVolumeChange/onRemove)는 타이핑과 무관하면 참조가 그대로라
// memo가 리렌더 자체를 건너뛴다. 만약 여기서 `(x, y) => onPositionChange(sound.id, x, y)`처럼
// 오브마다 새 클로저를 만들어 넘기면, positions가 바뀔 때(오브 하나만 옮겨도) 모든 오브가
// "새 함수를 받았으니" 다시 렌더링돼 버려서 memo 효과가 반쯤 무력화된다.
function AmbientOrbLayer({ positions, onPositionChange, onVolumeChange, onRemove }: AmbientOrbLayerProps) {
  const activeSounds = AMBIENT_SOUNDS.filter((sound) => positions[sound.id]);

  if (activeSounds.length === 0) return null;

  return (
    // z-[25]: 타이핑 영역을 감싸는 전체화면 div(z-20, HealingTypingScreen)보다 위에 있어야
    // 오브의 드래그/볼륨 조절 히트영역이 그 아래 깔려서 클릭을 가로채이지 않는다.
    <div className="pointer-events-none fixed inset-0 z-[25]">
      {activeSounds.map((sound) => {
        const position = positions[sound.id]!;
        return (
          <AmbientOrb
            key={sound.id}
            id={sound.id}
            sound={sound}
            x={position.x}
            y={position.y}
            volume={position.volume}
            onPositionChange={onPositionChange}
            onVolumeChange={onVolumeChange}
            onRemove={onRemove}
          />
        );
      })}
    </div>
  );
}

export default memo(AmbientOrbLayer);
