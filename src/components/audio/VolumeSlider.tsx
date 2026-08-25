"use client";

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  // 하단 바처럼 좁은 자리에는 기본값(w-24)이 맞지만, Settings 패널처럼 넓은 자리에서는
  // 호출하는 쪽에서 "flex-1" 등을 넘겨 남은 폭을 끝까지 채우게 할 수 있다.
  className?: string;
}

export default function VolumeSlider({ value, onChange, ariaLabel, className = "w-24 shrink-0" }: VolumeSliderProps) {
  return (
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label={ariaLabel}
      style={{ "--volume-fill": `${value * 100}%` } as React.CSSProperties}
      className={`volume-slider ${className}`}
    />
  );
}
