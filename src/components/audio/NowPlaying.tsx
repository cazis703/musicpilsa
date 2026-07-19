import { DiscIcon } from "@/components/ui/icons";
import type { AudioTrackMeta } from "@/lib/media-paths";

interface NowPlayingProps {
  track: AudioTrackMeta;
}

export default function NowPlaying({ track }: NowPlayingProps) {
  const label = `Now Playing: "${track.title}" by ${track.artist} (${track.license})`;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <DiscIcon className="h-4 w-4 shrink-0 animate-spin-slow text-white/70" />
      <div className="w-32 overflow-hidden sm:w-40" aria-live="off">
        <div className="flex w-max animate-marquee whitespace-nowrap text-xs text-white/60">
          <span className="pr-8">{label}</span>
          <span className="pr-8" aria-hidden="true">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
