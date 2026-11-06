import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { LanguageCode } from '../types';
import { legitimoCopy } from './legitimo';
import { mockupCopy, ProjectCopyKey } from './mockup';

// Keep locked until the real backend is integrated and its production data is verified.
export const MOCKUP_LOCK = true;

type CopyModeContextValue = {
  mockupMode: boolean;
  setMockupMode: (enabled: boolean) => void;
};

const CopyModeContext = createContext<CopyModeContextValue | null>(null);

export const CopyModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mockupMode, setMockupModeState] = useState(true);
  const setMockupMode = useCallback((enabled: boolean) => {
    if (!MOCKUP_LOCK) setMockupModeState(enabled);
  }, []);
  const value = useMemo(() => ({ mockupMode: MOCKUP_LOCK || mockupMode, setMockupMode }), [mockupMode, setMockupMode]);
  return <CopyModeContext.Provider value={value}>{children}</CopyModeContext.Provider>;
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
