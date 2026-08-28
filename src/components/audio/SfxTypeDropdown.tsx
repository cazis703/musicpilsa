"use client";

import { useEffect, useRef, useState } from "react";
import VolumeSlider from "@/components/audio/VolumeSlider";
import { ChevronDownIcon, SpeakerMutedIcon, SpeakerOnIcon } from "@/components/ui/icons";

interface SfxTypeOption<T extends string> {
  id: T;
  label: string;
}

interface SfxTypeDropdownProps<T extends string> {
  options: SfxTypeOption<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  // 버튼 위에 마우스를 올렸을 때 보여줄 짧은 툴팁 (예: "타이핑음", "완료음") — 지금 이
  // 드롭다운이 무엇을 고르는 건지 한눈에 알 수 있게 한다.
  tooltip: string;
  // 하단 바에서는 "타이핑음 볼륨 조절기"가 음악 슬라이더와 나란히 있으면 무엇의 볼륨인지
  // 헷갈린다는 피드백 때문에, 이 드롭다운을 펼쳤을 때 안쪽에서 같이 조절하게 한다. 넷 다
  // 넘기면(주로 하단 바) 트리거에 음표 아이콘과 함께 노출되고, 넘기지 않으면(Settings
  // 패널처럼 이미 별도 볼륨 섹션이 있는 곳) 기존과 동일하게 라벨만 있는 트리거로 남는다.
  volume?: number;
  onVolumeChange?: (value: number) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  volumeAriaLabel?: string;
}

// ThemeSwitcher(문장 세트 드롭다운)와 동일한 형태/동작(펼침, 바깥 클릭·Esc로 닫힘, 현재
// 선택 강조)을 공유하는 공용 드롭다운. 효과음 종류처럼 아이콘/부가정보 없이 라벨만 있는
// 선택지에 재사용한다.
export default function SfxTypeDropdown<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  tooltip,
  volume,
  onVolumeChange,
  isMuted = false,
  onToggleMute,
  volumeAriaLabel,
}: SfxTypeDropdownProps<T>) {
  const showVolumeControl = typeof volume === "number" && onVolumeChange !== undefined;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeOption = options.find((option) => option.id === value);

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
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${ariaLabel}: ${activeOption?.label ?? ""} (눌러서 변경${showVolumeControl ? ", 볼륨 포함" : ""})`}
        className="flex items-center gap-1 whitespace-nowrap text-xs text-white/60 transition-colors hover:text-white"
      >
        {showVolumeControl && <SpeakerOnIcon className="h-3.5 w-3.5 text-white/50" />}
        <span>{activeOption?.label}</span>
        <ChevronDownIcon
          className={`h-3 w-3 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* hover 툴팁 — 커지면서 페이드인되고, 마우스아웃되면 작아지면서 페이드아웃된다.
          펼침 목록과 같은 자리(bottom-full)를 쓰므로 열려있을 땐 숨긴다. */}
      {!isOpen && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 origin-bottom -translate-x-1/2 scale-75 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[10px] text-white/80 opacity-0 transition-all duration-150 ease-out group-hover:scale-100 group-hover:opacity-100"
        >
          {tooltip}
        </span>
      )}

      {/* 조건부로 마운트/언마운트하지 않고 항상 DOM에 두되 opacity/transform으로만
          접었다 펼친다 — 그래야 처음 열릴 때도 브라우저가 "닫힌 상태"를 이미 그려둔
          진짜 이전 프레임을 갖고 있어서 트랜지션이 확실히 재생된다. */}
      <div
        aria-hidden={!isOpen}
        className={`absolute bottom-full left-1/2 z-50 mb-2 w-48 origin-bottom -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur transition-[opacity,transform] duration-200 ease-out ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-wide text-white/40">{tooltip}</div>
        {showVolumeControl && (
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? "효과음 음소거 해제" : "효과음 음소거"}
              aria-pressed={isMuted}
              className="shrink-0 text-white/70 transition-colors hover:text-white"
            >
              {isMuted ? <SpeakerMutedIcon className="h-4 w-4" /> : <SpeakerOnIcon className="h-4 w-4" />}
            </button>
            <VolumeSlider
              value={isMuted ? 0 : (volume as number)}
              onChange={onVolumeChange as (value: number) => void}
              ariaLabel={volumeAriaLabel ?? "효과음 볼륨"}
              className="w-full flex-1"
            />
          </div>
        )}
        <ul role="listbox" aria-label={ariaLabel} className="py-1">
          {options.map((option) => {
            const isActive = option.id === value;
            return (
              <li key={option.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-xs transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
