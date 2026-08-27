"use client";

import { useEffect, useRef, useState } from "react";
import { EyeIcon, EyeOffIcon, PencilIcon } from "@/components/ui/icons";
import { MAX_RECIPIENT_NAME_LENGTH } from "@/hooks/useSiteTitle";

interface SiteTitleBarProps {
  recipientName: string;
  onRecipientNameChange: (name: string) => void;
  setLabel: string;
  isVisible: boolean;
  onHide: () => void;
  onShow: () => void;
  titleFontFamily: string;
}

// 이름이 있으면 "나"는 빼고 입력한 이름만 주어로 쓴다("나 화선에게" 아니라 "화선에게").
// 이름이 없을 때만 "나에게"로 남는다.
function buildTitle(recipientName: string, setLabel: string): string {
  const trimmed = recipientName.trim();
  const recipientPart = trimmed ? `${trimmed}에게` : "나에게";
  return `${recipientPart} 보내는 #${setLabel}의 메시지`;
}

export default function SiteTitleBar({
  recipientName,
  onRecipientNameChange,
  setLabel,
  isVisible,
  onHide,
  onShow,
  titleFontFamily,
}: SiteTitleBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(recipientName);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) return;
    setDraftName(recipientName);
    // 팝오버가 열리자마자 바로 타이핑할 수 있도록 포커스한다.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isEditing, recipientName]);

  useEffect(() => {
    if (!isEditing) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsEditing(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditing]);

  if (!isVisible) {
    return (
      <button
        type="button"
        onClick={onShow}
        aria-label="사이트 제목 다시 보기"
        className="fixed right-4 top-6 z-40 h-2 w-2 rounded-full bg-white/15 transition-colors hover:bg-white/40"
      />
    );
  }

  const handleSubmit = () => {
    onRecipientNameChange(draftName.trim());
    setIsEditing(false);
  };

  return (
    <div ref={containerRef} className="fixed left-1/2 top-28 z-40 -translate-x-1/2">
      <div className="group flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsEditing((prev) => !prev)}
          aria-label="사이트 제목 편집"
          className="rounded px-1 text-base text-white transition-colors hover:text-white/80 sm:text-lg"
          style={{ fontFamily: titleFontFamily }}
        >
          {buildTitle(recipientName, setLabel)}
        </button>
        <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            aria-label="사이트 제목 편집"
            className="text-white/30 transition-colors hover:text-white/70"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onHide}
            aria-label="사이트 제목 숨기기"
            className="text-white/30 transition-colors hover:text-white/70"
          >
            <EyeOffIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEditing && (
        <div
          role="dialog"
          aria-label="사이트 제목 설정"
          className="absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur"
        >
          <div className="mb-2 text-xs text-white/50">받는 사람 이름</div>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs text-white/60">나</span>
            <input
              ref={inputRef}
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value.slice(0, MAX_RECIPIENT_NAME_LENGTH))}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSubmit();
              }}
              placeholder="이름 (선택)"
              className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
            <span className="shrink-0 text-xs text-white/60">에게</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="truncate text-[11px] text-white/40" style={{ fontFamily: titleFontFamily }}>
              {buildTitle(draftName, setLabel)}
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] text-white transition-colors hover:bg-white/20"
            >
              적용
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              onHide();
              setIsEditing(false);
            }}
            className="mt-3 flex items-center gap-1 text-[11px] text-white/40 transition-colors hover:text-white/70"
          >
            <EyeIcon className="h-3 w-3" />
            제목 노출 끄기
          </button>
        </div>
      )}
    </div>
  );
}
