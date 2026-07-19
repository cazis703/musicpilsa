"use client";

import { BookIcon, HeartIcon, MirrorIcon, SunIcon } from "@/components/ui/icons";
import type { SentenceSetId } from "@/types/sentence";

interface ThemeSwitcherProps {
  activeSetId: SentenceSetId;
  activeLabel: string;
  onSwitch: () => void;
}

const SET_ICONS: Record<SentenceSetId, (props: { className?: string }) => JSX.Element> = {
  healing: HeartIcon,
  wisdom: BookIcon,
  positive: SunIcon,
  affirmation: MirrorIcon,
};

export default function ThemeSwitcher({ activeSetId, activeLabel, onSwitch }: ThemeSwitcherProps) {
  const Icon = SET_ICONS[activeSetId];

  return (
    <button
      type="button"
      onClick={onSwitch}
      aria-label={`문장 테마: ${activeLabel} (눌러서 변경)`}
      className="group flex items-center gap-1.5 text-xs text-white/60 transition-colors hover:text-white"
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{activeLabel}</span>
      <span className="text-white/30 transition-transform group-hover:translate-x-0.5">›</span>
    </button>
  );
}
