"use client";

import { RefreshIcon } from "@/components/ui/icons";

interface RewriteButtonProps {
  onRewrite: () => void;
}

export default function RewriteButton({ onRewrite }: RewriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onRewrite}
      aria-label="이 문장 다시쓰기 (Esc)"
      title="다시쓰기 (Esc)"
      className="flex items-center gap-1.5 text-xs text-white/60 transition-colors hover:text-white"
    >
      다시쓰기
      <RefreshIcon className="h-3.5 w-3.5" />
    </button>
  );
}
