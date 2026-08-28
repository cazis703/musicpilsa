"use client";

import { useEffect, useRef, useState } from "react";
import NowPlaying from "@/components/audio/NowPlaying";
import PlayingEqualizer from "@/components/audio/PlayingEqualizer";
import { ChevronDownIcon } from "@/components/ui/icons";
import { AUDIO_PATHS, getAudioTrackMeta } from "@/lib/media-paths";

interface MusicPlaylistDropdownProps {
  audioSrc: string;
  isPlaying: boolean;
  onSelect: (path: string) => void;
}

// 지금 재생 중인 곡 표시(NowPlaying)를 누르면 전체 재생목록이 펼쳐진다. 앞으로 곡이
// 계속 추가될 예정이라, "다음/이전 곡"으로 하나씩 넘기는 것 말고 목록에서 바로 골라 틀 수
// 있게 한다. 다른 드롭다운(SfxTypeDropdown, AmbientSoundControl)과 같은
// 펼침/바깥클릭·Esc 닫힘 동작을 공유한다.
export default function MusicPlaylistDropdown({ audioSrc, isPlaying, onSelect }: MusicPlaylistDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div ref={containerRef} className="relative min-w-0 shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="재생목록 (눌러서 곡 선택)"
        className="flex min-w-0 items-center gap-1"
      >
        <NowPlaying track={getAudioTrackMeta(audioSrc)} />
        <ChevronDownIcon
          className={`h-3 w-3 shrink-0 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* 조건부로 마운트/언마운트하지 않고 항상 DOM에 두되 opacity/transform으로만
          접었다 펼친다 — 그래야 처음 열릴 때도 브라우저가 "닫힌 상태"를 이미 그려둔
          진짜 이전 프레임을 갖고 있어서 트랜지션이 확실히 재생된다(막 마운트된 요소는
          리액트 렌더 두 번이 같은 프레임에 묶여버려 트랜지션이 씹히는 경우가 있었다). */}
      <div
        aria-hidden={!isOpen}
        className={`absolute bottom-full left-0 z-50 mb-2 w-64 origin-bottom-left overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur transition-[opacity,transform] duration-200 ease-out ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="px-3 pt-2.5 pb-1 text-[10px] uppercase tracking-wide text-white/40">재생목록</div>
        {/* settings-scroll: 스크롤은 되지만 브라우저 기본(흰색) 스크롤바는 숨겨서, 다른
            드롭다운 목록들과 같은 깔끔한 룩을 유지한다. */}
        <ul role="listbox" aria-label="재생목록" className="settings-scroll max-h-60 overflow-y-auto py-1">
          {AUDIO_PATHS.map((path) => {
            const meta = getAudioTrackMeta(path);
            const isActive = path === audioSrc;
            return (
              <li key={path} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  onClick={() => {
                    onSelect(path);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {/* 고정 폭 슬롯 — 활성 곡이 바뀌어도 제목 텍스트가 좌우로 밀리지 않는다 */}
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center">
                    {isActive && <PlayingEqualizer isPlaying={isPlaying} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs">{meta.title}</span>
                    <span className="block truncate text-[10px] text-white/40">{meta.artist}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
