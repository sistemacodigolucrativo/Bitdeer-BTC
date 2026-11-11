import React,{createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
import {LanguageCode} from '../types';
import {legitimoCopy} from './legitimo';
import {mockupCopy,ProjectCopyKey} from './mockup';
import {api} from '../services/api';

export const MOCKUP_LOCK=true;
export const MOCKUP_PREVIEW_MIN_DAYS=0;
export const MOCKUP_PREVIEW_MAX_DAYS=365;
type PreviewState={enabled:boolean;expiresAt:number|null};
type CopyModeContextValue={mockupMode:boolean;setMockupMode:(enabled:boolean)=>void;legitPreviewActive:boolean;startLegitPreview:(days:number)=>Promise<boolean>};
const CopyModeContext=createContext<CopyModeContextValue|null>(null);
const PreviewCountdownContext=createContext<number|null>(null);

export const CopyModeProvider:React.FC<{children:React.ReactNode}>=({children})=>{
  const [setting,setSetting]=useState<PreviewState>({enabled:false,expiresAt:null});
  const [now,setNow]=useState(Date.now);
  const refresh=useCallback(async()=>{
    try{const state=await api<PreviewState>('legit-preview.settings');setSetting(state);}
    catch{/* Fail closed: legitimate preview remains disabled if SQLite is unavailable. */}
  },[]);
  useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),10000);
    const visible=()=>{if(document.visibilityState==='visible')void refresh();};
    document.addEventListener('visibilitychange',visible);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[refresh]);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
  const legitPreviewActive=MOCKUP_LOCK&&setting.enabled&&!!setting.expiresAt&&setting.expiresAt*1000>now;
  const mockupMode=MOCKUP_LOCK&&!legitPreviewActive;
  const setMockupMode=useCallback((_enabled:boolean)=>{/* The display mode is controlled globally by an administrator in SQLite. */},[]);
  const startLegitPreview=useCallback(async(days:number)=>{
    if(!Number.isInteger(days)||days<MOCKUP_PREVIEW_MIN_DAYS||days>MOCKUP_PREVIEW_MAX_DAYS)return false;
    try{const result=await api<PreviewState>('admin.legit-preview.settings',{days});setSetting(result);return true;}
    catch{return false;}
  },[]);
  useEffect(()=>{document.documentElement.dataset.projectCopyMode=mockupMode?'mockup':'legitimate';
    return()=>{delete document.documentElement.dataset.projectCopyMode;};},[mockupMode]);
  const remaining=legitPreviewActive&&setting.expiresAt?Math.max(0,setting.expiresAt*1000-now):0;
  const value=useMemo(()=>({mockupMode,setMockupMode,legitPreviewActive,startLegitPreview}),[mockupMode,setMockupMode,legitPreviewActive,startLegitPreview]);
  return <CopyModeContext.Provider value={value}><PreviewCountdownContext.Provider value={remaining}>{children}</PreviewCountdownContext.Provider></CopyModeContext.Provider>;
};
export const useProjectCopy=(language:LanguageCode)=>{
  const mode=useContext(CopyModeContext);if(!mode)throw new Error('useProjectCopy must be used inside CopyModeProvider');
  const copy=useCallback((key:ProjectCopyKey)=>{const catalog=mode.mockupMode?mockupCopy:legitimoCopy;return catalog[key][language]??catalog[key].pt;},[language,mode.mockupMode]);
  return {...mode,copy};
};
export const useLegitPreviewCountdown=()=>{const remaining=useContext(PreviewCountdownContext);if(remaining===null)throw new Error('useLegitPreviewCountdown must be used inside CopyModeProvider');return remaining;};
