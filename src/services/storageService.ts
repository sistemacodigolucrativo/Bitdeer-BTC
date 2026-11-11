/** Browser storage is intentionally limited to the visual theme. Account data
 * and account preferences are served by the authenticated PHP/SQLite API. */
type VisualPreferences={theme:'dark'|'light'};
const THEME_KEY='btc_visual_theme_v1';
class StorageService {
  getPreferences():VisualPreferences {
    try{
      const saved=localStorage.getItem(THEME_KEY);
      if(saved==='light'||saved==='dark')return {theme:saved};
      const legacyRaw=localStorage.getItem('btc_mining_user_preferences_v1');
      if(legacyRaw){
        const legacy=JSON.parse(legacyRaw) as Record<string,unknown>;
        if(Object.prototype.hasOwnProperty.call(legacy,'lastUpdated')){delete legacy.lastUpdated;localStorage.setItem('btc_mining_user_preferences_v1',JSON.stringify(legacy));}
        const theme=legacy.theme==='light'?'light':'dark';localStorage.setItem(THEME_KEY,theme);return {theme};
      }
      return {theme:'dark'};
    }
    catch{return {theme:'dark'};}
  }
  savePreferences(preferences:Partial<VisualPreferences>):VisualPreferences {
    const current=this.getPreferences();const updated={...current,...preferences};
    try{if(typeof updated.theme==='string')localStorage.setItem(THEME_KEY,updated.theme);}
    catch{/* Theme is visual-only; the app continues with its in-memory value. */}
    if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('btc_miner_pref_change',{detail:updated}));
    return updated;
  }
  getLegacyMemberLanguage(id:number):'pt'|'en'|'es'|null {
    try{const value=localStorage.getItem(`btc_member_language_${id}`);return value==='pt'||value==='en'||value==='es'?value:null;}
    catch{return null;}
  }
  removeLegacyMemberLanguage(id:number):void {try{localStorage.removeItem(`btc_member_language_${id}`);}catch{/* Removal is only cleanup after the SQLite write succeeded. */}}
  reset():void {try{localStorage.removeItem(THEME_KEY);}catch{/* Optional visual preference. */}}
}
export const storageService=new StorageService();
