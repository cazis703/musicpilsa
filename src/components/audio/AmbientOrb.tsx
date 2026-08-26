"use client";

import { memo, useCallback, useRef, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";
import {
  HALO_MAX_VMIN,
  HALO_MIN_VMIN,
  HALO_TOLERANCE_VMIN,
  ORB_SIZE_CEILING_PX,
  ORB_SIZE_FLOOR_PX,
  ORB_SIZE_VMIN,
  pxToVmin,
  radiusVminFromVolume,
  resizeCursorFromAngle,
  volumeFromRadiusVmin,
} from "@/lib/ambient-orb-geometry";
import type { AmbientSoundId, AmbientSoundMeta } from "@/types/ambientSound";

// 오브를 감싸는 상자 크기 — 최대 볼륨일 때의 바깥 원(HALO_MAX_VMIN*2 = 30vmin)과 삭제
// 배지 여백을 넉넉히 담을 수 있는 크기. vmin이라 창 크기에 따라 자동으로 커지고 작아지되,
// 너무 작거나 너무 커지지 않도록 px 상하한을 둔다.
const WRAP_SIZE_CSS = "clamp(200px, 36vmin, 280px)";
// clampAmbientPosition(ambient-orb-geometry.ts)의 "화면 밖으로 못 나가는 여백" 계산과
// 반드시 같은 px 상하한을 써야 실제 렌더 크기와 드래그 한계가 어긋나지 않는다.
const ORB_SIZE_CSS = `clamp(${ORB_SIZE_FLOOR_PX}px, ${ORB_SIZE_VMIN}vmin, ${ORB_SIZE_CEILING_PX}px)`;
// 바깥 원(halo) 지름의 px 상하한 — HALO_MIN_VMIN/HALO_MAX_VMIN의 대략적인 px 환산값.
// 하한은 오브 본체(ORB_SIZE_FLOOR_PX=40px)보다 살짝만 큰 값으로 둬서, 볼륨 0%일 때
// 바깥 원이 오브를 감싸는 얇은 테두리 정도로만 보이게 한다.
const HALO_SIZE_FLOOR_PX = 46;
const HALO_SIZE_CEILING_PX = 220;

interface AmbientOrbProps {
  id: AmbientSoundId;
  sound: AmbientSoundMeta;
  x: number;
  y: number;
  volume: number;
  onPositionChange: (id: AmbientSoundId, x: number, y: number) => void;
  onVolumeChange: (id: AmbientSoundId, volume: number) => void;
  onRemove: (id: AmbientSoundId) => void;
}

// memo: AmbientOrbLayer가 다른(자신과 무관한) 리렌더 후에도 props가 그대로면 이 컴포넌트는
// 다시 그리지 않는다. 특히 타이핑 중 한 글자씩 리렌더되는 상위 트리와 완전히 무관해지므로,
// 오브가 여러 개 떠 있어도 타이핑 성능에 영향을 주지 않는다(AmbientOrbLayer가 각 오브에
// 매번 새 클로저를 만들어 넘기지 않고 id + 안정된 콜백을 그대로 넘기는 것과 함께 동작).
function AmbientOrb({ id, sound, x, y, volume, onPositionChange, onVolumeChange, onRemove }: AmbientOrbProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isDraggingOrb, setIsDraggingOrb] = useState(false);
  const [haloState, setHaloState] = useState<"idle" | "hint" | "grabbed">("idle");
  // 바깥 원 가장자리 위 지금 커서 위치에 맞는 리사이즈 커서(수평/수직/대각선 양쪽 화살표).
  // hover/드래그 중일 때만 값이 있고, idle(가장자리에서 벗어남)로 돌아가면 다시 null이 되어
  // 다른 오브와 똑같은 기본 커서로 돌아간다.
  const [haloCursor, setHaloCursor] = useState<string | null>(null);
  const dragStartRef = useRef({ clientX: 0, clientY: 0, originX: x, originY: y });

  const Icon = sound.icon;
  const haloRadiusVmin = radiusVminFromVolume(volume);
  const haloDiameterVmin = haloRadiusVmin * 2;
  const haloSizeCss = `clamp(${HALO_SIZE_FLOOR_PX}px, ${haloDiameterVmin}vmin, ${HALO_SIZE_CEILING_PX}px)`;

  const wrapCenter = useCallback(() => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  // ---- 안쪽 원(오브 본체) 드래그 = 위치 이동 ----
  const handleOrbPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDraggingOrb(true);
      dragStartRef.current = { clientX: event.clientX, clientY: event.clientY, originX: x, originY: y };
    },
    [x, y]
  );

  const handleOrbPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!isDraggingOrb) return;
      event.stopPropagation();
      const layer = wrapRef.current?.parentElement;
      if (!layer) return;
      const rect = layer.getBoundingClientRect();
      const dx = event.clientX - dragStartRef.current.clientX;
      const dy = event.clientY - dragStartRef.current.clientY;
      const nextX = dragStartRef.current.originX + (dx / rect.width) * 100;
      const nextY = dragStartRef.current.originY + (dy / rect.height) * 100;
      onPositionChange(id, nextX, nextY);
    },
    [id, isDraggingOrb, onPositionChange]
  );

  const handleOrbPointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsDraggingOrb(false);
  }, []);

  // ---- 바깥 원(halo) 가장자리 드래그 = 볼륨 조절 ----
  // 클릭 판정은 항상 "지금 이 순간의 창 크기"를 기준으로 px→vmin 환산해서 하므로, 창 크기가
  // 바뀌어도 시각적으로 보이는 원 가장자리와 클릭 판정 위치가 어긋나지 않는다.
  const handleHaloPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("button")) return; // 오브 본체/삭제 버튼은 각자 처리
      const center = wrapCenter();
      if (!center) return;
      const dx = event.clientX - center.x;
      const dy = event.clientY - center.y;
      const distVmin = pxToVmin(Math.hypot(dx, dy));
      if (Math.abs(distVmin - haloRadiusVmin) > HALO_TOLERANCE_VMIN) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setHaloState("grabbed");
      setHaloCursor(resizeCursorFromAngle(dx, dy));
    },
    [haloRadiusVmin, wrapCenter]
  );

  const handleHaloPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const center = wrapCenter();
      if (!center) return;
      const dx = event.clientX - center.x;
      const dy = event.clientY - center.y;
      const distVmin = pxToVmin(Math.hypot(dx, dy));

      if (haloState === "grabbed") {
        const clampedRadiusVmin = Math.min(HALO_MAX_VMIN, Math.max(HALO_MIN_VMIN, distVmin));
        onVolumeChange(id, volumeFromRadiusVmin(clampedRadiusVmin));
        setHaloCursor(resizeCursorFromAngle(dx, dy));
        return;
      }
      const isOnEdge = Math.abs(distVmin - haloRadiusVmin) <= HALO_TOLERANCE_VMIN;
      setHaloState(isOnEdge ? "hint" : "idle");
      setHaloCursor(isOnEdge ? resizeCursorFromAngle(dx, dy) : null);
    },
    [id, haloState, haloRadiusVmin, onVolumeChange, wrapCenter]
  );

  const handleHaloPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (haloState === "grabbed") {
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // 이미 캡처가 해제된 경우 무시.
        }
      }
      setHaloState("idle");
      setHaloCursor(null);
    },
    [haloState]
  );

  const handleHaloPointerLeave = useCallback(() => {
    if (haloState !== "grabbed") {
      setHaloState("idle");
      setHaloCursor(null);
    }
  }, [haloState]);

  return (
    <div
      ref={wrapRef}
      className="group absolute -translate-x-1/2 -translate-y-1/2 animate-orb-enter"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: WRAP_SIZE_CSS,
        height: WRAP_SIZE_CSS,
        pointerEvents: "auto",
        cursor: haloCursor ?? undefined,
      }}
      onPointerDown={handleHaloPointerDown}
      onPointerMove={handleHaloPointerMove}
      onPointerUp={handleHaloPointerUp}
      onPointerCancel={handleHaloPointerUp}
      onPointerLeave={handleHaloPointerLeave}
    >
      <div className={`absolute inset-0 ${isDraggingOrb ? "" : "animate-orb-bob"}`}>
        {/* 바깥 원(halo) — 반지름 자체가 볼륨을 나타낸다 */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[background,box-shadow] duration-200"
          style={{
            width: haloSizeCss,
            height: haloSizeCss,
            background: `radial-gradient(circle, color-mix(in srgb, ${sound.accent} ${haloState === "idle" ? 13 : 22}%, transparent) 0%, color-mix(in srgb, ${sound.accent} ${haloState === "idle" ? 5 : 9}%, transparent) 55%, transparent 78%)`,
            boxShadow:
              haloState === "idle"
                ? `0 0 0 1px color-mix(in srgb, ${sound.accent} 20%, transparent) inset`
                : `0 0 0 ${haloState === "grabbed" ? 3 : 2.5}px color-mix(in srgb, ${sound.accent} ${haloState === "grabbed" ? 62 : 50}%, transparent) inset, 0 0 22px -2px color-mix(in srgb, ${sound.accent} 45%, transparent)`,
          }}
        />

        {/* 안쪽 원(오브 본체) — 드래그하면 위치 이동 */}
        <button
          type="button"
          aria-label={`${sound.label} 위치 이동 핸들 (드래그)`}
          onPointerDown={handleOrbPointerDown}
          onPointerMove={handleOrbPointerMove}
          onPointerUp={handleOrbPointerUp}
          onPointerCancel={handleOrbPointerUp}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none items-center justify-center rounded-full border active:cursor-grabbing"
          style={{
            width: ORB_SIZE_CSS,
            height: ORB_SIZE_CSS,
            borderColor: sound.accent,
            background: `color-mix(in srgb, ${sound.accent} 20%, rgba(12, 18, 36, 0.72))`,
            color: sound.accent,
            boxShadow: `0 0 18px -4px ${sound.accent}, 0 0 0 1px color-mix(in srgb, ${sound.accent} 40%, transparent) inset`,
          }}
        >
          <Icon className="h-6 w-6" />
        </button>

        {/* 삭제 버튼 — hover 중에만 노출 */}
        <button
          type="button"
          aria-label={`${sound.label} 삭제`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove(id);
          }}
          className="pointer-events-none absolute left-[calc(50%+20px)] top-[calc(50%-20px)] flex h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/90 text-white/50 opacity-0 shadow-lg transition-opacity duration-150 hover:border-red-400/70 hover:text-red-400 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 볼륨 % 라벨 */}
      <div className="pointer-events-none absolute left-1/2 top-[calc(50%+34px)] -translate-x-1/2 whitespace-nowrap text-[9.5px] tracking-wide text-white/40">
        {Math.round(volume * 100)}%
      </div>
    </div>
  );
}

export default memo(AmbientOrb);
