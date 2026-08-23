"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseSiteTitleReturn {
  recipientName: string;
  setRecipientName: (name: string) => void;
  isVisible: boolean;
  hideTitle: () => void;
  showTitle: () => void;
}

export const SITE_TITLE_NAME_STORAGE_KEY = "musicpilsa:siteTitleName";
export const SITE_TITLE_VISIBLE_STORAGE_KEY = "musicpilsa:siteTitleVisible";

export const MAX_RECIPIENT_NAME_LENGTH = 12;

export function useSiteTitle(): UseSiteTitleReturn {
  const [recipientName, setRecipientNameState] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  // localStorage 복원은 마운트 이후 1회만 수행한다(useFontSettings와 동일한 이유: 마운트
  // 이전에 브라우저 API/저장값을 읽으면 서버 렌더 결과와 달라져 하이드레이션 불일치가 난다).
  const didMountNameRef = useRef(false);
  const didMountVisibleRef = useRef(false);

  useEffect(() => {
    const storedName = window.localStorage.getItem(SITE_TITLE_NAME_STORAGE_KEY);
    if (storedName !== null) {
      setRecipientNameState(storedName.slice(0, MAX_RECIPIENT_NAME_LENGTH));
    }

    const storedVisible = window.localStorage.getItem(SITE_TITLE_VISIBLE_STORAGE_KEY);
    if (storedVisible === "false") {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!didMountNameRef.current) {
      didMountNameRef.current = true;
      return;
    }
    window.localStorage.setItem(SITE_TITLE_NAME_STORAGE_KEY, recipientName);
  }, [recipientName]);

  useEffect(() => {
    if (!didMountVisibleRef.current) {
      didMountVisibleRef.current = true;
      return;
    }
    window.localStorage.setItem(SITE_TITLE_VISIBLE_STORAGE_KEY, String(isVisible));
  }, [isVisible]);

  const setRecipientName = useCallback((name: string) => {
    setRecipientNameState(name.slice(0, MAX_RECIPIENT_NAME_LENGTH));
  }, []);

  const hideTitle = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showTitle = useCallback(() => {
    setIsVisible(true);
  }, []);

  return { recipientName, setRecipientName, isVisible, hideTitle, showTitle };
}
