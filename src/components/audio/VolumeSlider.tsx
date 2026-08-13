"use client";

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}

export default function VolumeSlider({ value, onChange, ariaLabel }: VolumeSliderProps) {
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
      className="volume-slider w-24 shrink-0"
    />
  );
}
