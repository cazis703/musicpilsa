// 배경음 오브의 크기/볼륨 반지름 계산을 모두 뷰포트 대비 상대 단위(vmin)로 통일한다.
// vmin 기반이면 브라우저 창 크기가 바뀌어도 CSS만으로 오브가 자동으로 따라 커지고 작아지며,
// 포인터 클릭 판정(hit-test)도 이벤트가 일어난 그 순간의 창 크기로 다시 환산해서 시각적
// 크기와 항상 일치시킬 수 있다(고정 px였다면 창 크기가 바뀔 때 시각적 크기와 어긋난다).
export const HALO_MIN_VMIN = 3.2; // 거의 무음일 때 바깥 원 반지름
export const HALO_MAX_VMIN = 15; // 최대 볼륨일 때 바깥 원 반지름
export const HALO_TOLERANCE_VMIN = 2.2; // 바깥 원 가장자리로 인식할 오차 범위
export const ORB_SIZE_VMIN = 7; // 오브 본체(드래그 손잡이) 지름
export const ORB_SIZE_FLOOR_PX = 40; // 오브 본체 지름의 px 하한
export const ORB_SIZE_CEILING_PX = 56; // 오브 본체 지름의 px 상한
// AmbientOrb.tsx의 ORB_SIZE_CSS(`clamp(${ORB_SIZE_FLOOR_PX}px, ${ORB_SIZE_VMIN}vmin, ${ORB_SIZE_CEILING_PX}px)`)와
// 반드시 같은 값을 써야 한다 — 실제로 렌더링되는 오브 크기와 "화면 밖으로 못 나가게 가두는 여백" 크기가 어긋나면
// 안 된다(어긋나면 어떤 창 크기에서는 여백이 실제 오브 절반보다 커서 남는 간격이 생기고, 반대 방향에서는 모자라 잘린다).

// document.documentElement.clientWidth/clientHeight를 쓴다 — window.innerWidth/innerHeight는
// 세로 스크롤바가 있을 때 그 폭까지 포함해버려서, position:fixed 오브가 실제로 배치되는
// 영역(스크롤바를 뺀 뷰포트)과 살짝 어긋날 수 있다.
export function viewportSizePx(): { width: number; height: number } {
  return { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
}

export function viewportMinPx(): number {
  const { width, height } = viewportSizePx();
  return Math.min(width, height);
}

export function vminToPx(vmin: number): number {
  return (vmin / 100) * viewportMinPx();
}

export function pxToVmin(px: number): number {
  const base = viewportMinPx();
  return base === 0 ? 0 : (px / base) * 100;
}

export function volumeFromRadiusVmin(radiusVmin: number): number {
  return Math.min(1, Math.max(0, (radiusVmin - HALO_MIN_VMIN) / (HALO_MAX_VMIN - HALO_MIN_VMIN)));
}

export function radiusVminFromVolume(volume: number): number {
  return HALO_MIN_VMIN + Math.min(1, Math.max(0, volume)) * (HALO_MAX_VMIN - HALO_MIN_VMIN);
}

// 바깥 원(halo) 가장자리 위, 중심 기준 (dx, dy) 지점에 커서를 올렸을 때 보여줄 리사이즈
// 커서. 그 지점에서 원 반지름을 늘리거나 줄이는 드래그 방향(=중심에서 그 지점을 잇는
// 반지름 방향)과 시각적으로 일치하는 커서를 8방향(45도 간격)으로 골라 보여준다 —
// 오른쪽/왼쪽은 수평 화살표, 위/아래는 수직 화살표, 대각선 네 곳은 대각선 화살표.
export function resizeCursorFromAngle(dx: number, dy: number): "ew-resize" | "ns-resize" | "nwse-resize" | "nesw-resize" {
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const normalized = ((angleDeg % 360) + 360) % 360;
  const sector = Math.round(normalized / 45) % 8;
  const cursors = ["ew-resize", "nwse-resize", "ns-resize", "nesw-resize", "ew-resize", "nwse-resize", "ns-resize", "nesw-resize"] as const;
  return cursors[sector];
}

// 오브 위치(x/y %)를 지금 창 크기 기준으로 화면 안에 가둔다. 여백 기준은 볼륨을 나타내는
// 바깥 원(halo, 장식용)이 아니라 "드래그로 옮기는 손잡이인 안쪽 원(오브 본체)의 절반
// 크기"다 — 볼륨 원은 화면 밖으로 잘려도 괜찮지만, 손잡이 자체는 절반 정도는 화면 안에
// 남아 있어야 다시 클릭해서 끌어올 수 있기 때문이다(완전히 화면 밖으로 사라지면 드래그로
// 되찾을 수 없다). 창 크기가 바뀔 때도 이 함수를 다시 호출해 재적용하면(useAmbientSounds의
// resize 리스너) 오브가 화면 안쪽으로 따라 들어온다.
export function clampAmbientPosition(x: number, y: number): { x: number; y: number } {
  if (typeof window === "undefined") return { x, y };
  const { width, height } = viewportSizePx();
  const orbSizePx = Math.min(ORB_SIZE_CEILING_PX, Math.max(ORB_SIZE_FLOOR_PX, vminToPx(ORB_SIZE_VMIN)));
  const marginPx = orbSizePx / 2;
  // 여백이 화면 절반을 넘어서면(창이 극단적으로 작을 때) min/max가 뒤집히므로 48%로 상한을 둔다.
  const marginXPercent = Math.min(48, (marginPx / width) * 100);
  const marginYPercent = Math.min(48, (marginPx / height) * 100);
  return {
    x: Math.min(100 - marginXPercent, Math.max(marginXPercent, x)),
    y: Math.min(100 - marginYPercent, Math.max(marginYPercent, y)),
  };
}
