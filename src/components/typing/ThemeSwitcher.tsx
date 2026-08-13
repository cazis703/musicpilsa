"use client";

import { useEffect, useRef, useState } from "react";
import { BookIcon, ChevronDownIcon, HeartIcon, MirrorIcon, NoteIcon, SunIcon } from "@/components/ui/icons";
import type { SentenceSetId, SentenceSetMeta } from "@/types/sentence";

interface ThemeSwitcherProps {
  sets: SentenceSetMeta[];
  activeSetId: SentenceSetId;
  onSelect: (setId: SentenceSetId) => void;
}

// 알려진 Set에는 전용 아이콘을, 추후 추가될 새 Set에는 NoteIcon을 기본값으로 사용한다.
const SET_ICONS: Partial<Record<SentenceSetId, (props: { className?: string }) => JSX.Element>> = {
  healing: HeartIcon,
  wisdom: BookIcon,
  positive: SunIcon,
  affirmation: MirrorIcon,
};

function getSetIcon(id: SentenceSetId) {
  return SET_ICONS[id] ?? NoteIcon;
}

export default function ThemeSwitcher({ sets, activeSetId, onSelect }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSet = sets.find((set) => set.id === activeSetId);
  const ActiveIcon = getSetIcon(activeSetId);

  // 바깥 클릭 또는 Esc로 드롭다운을 닫는다.
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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`문장 테마: ${activeSet?.label ?? ""} (눌러서 변경)`}
        className="flex items-center gap-1.5 text-xs text-white/60 transition-colors hover:text-white"
      >
        <ActiveIcon className="h-3.5 w-3.5" />
        <span>{activeSet?.label}</span>
        <ChevronDownIcon
          className={`h-3 w-3 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="문장 테마 목록"
          className="absolute top-full left-1/2 z-50 mt-2 w-48 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 py-1 backdrop-blur"
        >
          {sets.map((set) => {
            const SetIcon = getSetIcon(set.id);
            const isActive = set.id === activeSetId;
            return (
              <li key={set.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(set.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <SetIcon className="h-3.5 w-3.5" />
                  {set.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
