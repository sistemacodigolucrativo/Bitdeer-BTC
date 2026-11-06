import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LanguageCode } from '../types';
import { legitimoCopy } from './legitimo';
import { mockupCopy, ProjectCopyKey } from './mockup';

// Keep the default lock until real backend data is verified; only the browser-local timer may preview legitimate copy.
export const MOCKUP_LOCK = true;
export const MOCKUP_PREVIEW_DURATION_MS = 2 * 60 * 60 * 1000;
const PREVIEW_STORAGE_KEY = 'bitdeer-legit-copy-preview-until';

type CopyModeContextValue = {
  mockupMode: boolean;
  setMockupMode: (enabled: boolean) => void;
  legitPreviewActive: boolean;
  startLegitPreview: () => boolean;
};

const CopyModeContext = createContext<CopyModeContextValue | null>(null);
const PreviewCountdownContext = createContext<number | null>(null);

function readPreviewUntil(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const until = Number(window.localStorage.getItem(PREVIEW_STORAGE_KEY));
    if (Number.isFinite(until) && until > Date.now()) return until;
    window.localStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch {
    // The regular mockup lock remains in effect if browser storage is unavailable.
  }
  return 0;
}

export const CopyModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unlockedMockupMode, setUnlockedMockupMode] = useState(true);
  const [previewUntil, setPreviewUntil] = useState(readPreviewUntil);
  const [now, setNow] = useState(Date.now);
  const legitPreviewActive = MOCKUP_LOCK && previewUntil > now;
  const mockupMode = MOCKUP_LOCK ? !legitPreviewActive : unlockedMockupMode;

  const setMockupMode = useCallback((enabled: boolean) => {
    if (!MOCKUP_LOCK) setUnlockedMockupMode(enabled);
  }, []);

  const startLegitPreview = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const until = Date.now() + MOCKUP_PREVIEW_DURATION_MS;
    try {
      window.localStorage.setItem(PREVIEW_STORAGE_KEY, String(until));
    } catch {
      return false;
    }
    setNow(Date.now());
    setPreviewUntil(until);
    return true;
  }, []);

  useEffect(() => {
    if (!previewUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [previewUntil]);

  useEffect(() => {
    if (!previewUntil || now < previewUntil) return;
    try {
      window.localStorage.removeItem(PREVIEW_STORAGE_KEY);
    } catch {
      // Expired timestamps are ignored on the next read even if removal fails.
    }
    setPreviewUntil(0);
  }, [now, previewUntil]);

  useEffect(() => {
    const syncPreview = (event: StorageEvent) => {
      if (event.key !== PREVIEW_STORAGE_KEY && event.key !== null) return;
      const until = Number(event.newValue);
      setPreviewUntil(Number.isFinite(until) && until > Date.now() ? until : 0);
      setNow(Date.now());
    };
    window.addEventListener('storage', syncPreview);
    return () => window.removeEventListener('storage', syncPreview);
  }, []);

  const previewRemainingMs = legitPreviewActive ? Math.max(0, previewUntil - now) : 0;
  const value = useMemo(() => ({
    mockupMode,
    setMockupMode,
    legitPreviewActive,
    startLegitPreview,
  }), [mockupMode, setMockupMode, legitPreviewActive, startLegitPreview]);
  return <CopyModeContext.Provider value={value}>
    <PreviewCountdownContext.Provider value={previewRemainingMs}>
      {children}
    </PreviewCountdownContext.Provider>
  </CopyModeContext.Provider>;
};

export const useProjectCopy = (language: LanguageCode) => {
  const mode = useContext(CopyModeContext);
  if (!mode) throw new Error('useProjectCopy must be used inside CopyModeProvider');
  const copy = useCallback((key: ProjectCopyKey) => {
    const catalog = mode.mockupMode ? mockupCopy : legitimoCopy;
    return catalog[key][language] ?? catalog[key].pt;
  }, [language, mode.mockupMode]);
  return { ...mode, copy };
};

export const useLegitPreviewCountdown = () => {
  const remaining = useContext(PreviewCountdownContext);
  if (remaining === null) throw new Error('useLegitPreviewCountdown must be used inside CopyModeProvider');
  return remaining;
};
