"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUDIO_PATHS,
  VIDEO_PATHS,
  VIDEO_READY_TIMEOUT_MS,
  pickNextPath,
  pickPreviousPath,
  pickRandomPath,
} from "@/lib/media-paths";
import type { MediaLoadStatus, UseBackgroundMediaReturn } from "@/types/media";

export function useBackgroundMedia(): UseBackgroundMediaReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [videoStatus, setVideoStatus] = useState<MediaLoadStatus>("loading");
  const [audioStatus, setAudioStatus] = useState<MediaLoadStatus>("loading");
  const [videoSrc, setVideoSrc] = useState<string>(VIDEO_PATHS[0]);
  const [audioSrc, setAudioSrc] = useState<string>(AUDIO_PATHS[0]);

  // 첫 렌더링(서버/클라이언트 하이드레이션)에서는 항상 목록의 첫 파일을 사용하고,
  // 마운트 이후에만 랜덤 선택으로 교체한다. 마운트 시점 이전에 Math.random()을 쓰면
  // 서버와 클라이언트가 서로 다른 파일을 렌더링해 하이드레이션 불일치가 발생하기 때문이다.
  useEffect(() => {
    setVideoSrc(pickRandomPath(VIDEO_PATHS, null));
    setAudioSrc(pickRandomPath(AUDIO_PATHS, null));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let settled = false;

    const markReady = () => {
      if (settled) return;
      settled = true;
      setVideoStatus("ready");
    };

    const markError = () => {
      if (settled) return;
      settled = true;
      setVideoStatus("error");
    };

    setVideoStatus("loading");
    settled = false;
    const timeoutId = setTimeout(markError, VIDEO_READY_TIMEOUT_MS);

    video.load();
    video.play().catch(() => {
      // 자동재생 거부(NotAllowedError)는 오류가 아니라 사용자 인터랙션 대기 상태로 간주.
    });

    if (video.readyState >= 3) {
      markReady();
    }

    const handleEnded = () => {
      setVideoSrc((prev) => pickRandomPath(VIDEO_PATHS, prev));
    };

    video.addEventListener("playing", markReady);
    video.addEventListener("canplay", markReady);
    video.addEventListener("error", markError);
    video.addEventListener("ended", handleEnded);

    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener("playing", markReady);
      video.removeEventListener("canplay", markReady);
      video.removeEventListener("error", markError);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoSrc]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const markReady = () => setAudioStatus("ready");
    const markError = () => setAudioStatus("error");
    const handleEnded = () => {
      setAudioSrc((prev) => pickRandomPath(AUDIO_PATHS, prev));
    };

    audio.load();
    audio.play().catch(() => {
      // 자동재생 거부(NotAllowedError)는 오류가 아니라 사용자 인터랙션 대기 상태로 간주.
      // 최초 진입 시에는 HealingTypingScreen의 첫 입력 이벤트에서 별도로 재생을 시도한다.
    });

    audio.addEventListener("canplay", markReady);
    audio.addEventListener("error", markError);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("canplay", markReady);
      audio.removeEventListener("error", markError);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioSrc]);

  const nextVideo = useCallback(() => {
    setVideoSrc((prev) => pickNextPath(VIDEO_PATHS, prev));
  }, []);

  const nextAudio = useCallback(() => {
    setAudioSrc((prev) => pickNextPath(AUDIO_PATHS, prev));
  }, []);

  const previousAudio = useCallback(() => {
    setAudioSrc((prev) => pickPreviousPath(AUDIO_PATHS, prev));
  }, []);

  return {
    videoStatus,
    audioStatus,
    videoRef,
    audioRef,
    videoSrc,
    audioSrc,
    nextVideo,
    nextAudio,
    previousAudio,
  };
}
