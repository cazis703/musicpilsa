"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";

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
}: SfxTypeDropdownProps<T>) {
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
        aria-label={`${ariaLabel}: ${activeOption?.label ?? ""} (눌러서 변경)`}
        className="flex items-center gap-1 whitespace-nowrap text-xs text-white/60 transition-colors hover:text-white"
      >
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

      {isOpen && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-40 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 py-1 backdrop-blur"
        >
          {options.map((option) => {
            const isActive = option.id === value;
            return (
              <li key={option.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
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
      )}
    </div>
  );
}
