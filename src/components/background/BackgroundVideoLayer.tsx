import FallbackNotice from "@/components/background/FallbackNotice";
import type { MediaLoadStatus } from "@/types/media";

interface BackgroundVideoLayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoStatus: MediaLoadStatus;
  videoSrc: string;
}

export default function BackgroundVideoLayer({ videoRef, videoStatus, videoSrc }: BackgroundVideoLayerProps) {
  return (
    <>
      <video
        ref={videoRef}
        className={`fixed inset-0 z-[1] h-full w-full object-cover transition-opacity duration-700 ${
          videoStatus === "ready" ? "opacity-60" : "opacity-0"
        }`}
        style={{ filter: "brightness(0.6) saturate(0.8)" }}
        src={videoSrc}
        muted
        autoPlay
        playsInline
        aria-hidden="true"
      />
      {videoStatus === "error" && <FallbackNotice />}
    </>
  );
}
