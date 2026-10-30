import { LanguageCode, UserPreferences } from '../types';

const STORAGE_KEY = 'btc_mining_user_preferences_v1';
const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'pt', // Default to Portuguese for this user, or detect browser
  lastUpdated: new Date().toISOString(),
  isFirstLaunch: true,
  theme: 'dark'
};

/**
 * Service to manage local persistence with backend readiness.
 * Supports localStorage with graceful fallback, and async API mocking
 * for seamless integration when backend endpoints are connected.
 */
class StorageService {
  private memoryCache: UserPreferences | null = null;

  constructor() {
    // Determine default language from browser if available and not yet saved
    if (typeof window !== 'undefined') {
      const stored = this.getStoredData();
      if (!stored) {
        const browserLang = navigator.language.toLowerCase();
        let detectedLang: LanguageCode = 'pt';
        if (browserLang.startsWith('es')) detectedLang = 'es';
        else if (browserLang.startsWith('en')) detectedLang = 'en';
        
        this.savePreferences({
          ...DEFAULT_PREFERENCES,
          language: detectedLang
        });
      }
    }
  }

  private getStoredData(): UserPreferences | null {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as UserPreferences;
    } catch (err) {
      console.warn('Could not read from localStorage:', err);
      return this.memoryCache;
    }
  }

  /**
   * Get current stored preferences synchronously
   */
  public getPreferences(): UserPreferences {
    const data = this.getStoredData();
    if (data) {
      this.memoryCache = data;
      return data;
    }
    return this.memoryCache || DEFAULT_PREFERENCES;
  }

  /**
   * Save preferences to localStorage (synchronous)
   */
  public savePreferences(preferences: Partial<UserPreferences>): UserPreferences {
    try {
      const current = this.getPreferences();
      const updated: UserPreferences = {
        ...current,
        ...preferences,
        lastUpdated: new Date().toISOString()
      };
      
      this.memoryCache = updated;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        // Dispatch custom event for real-time reactivity
        window.dispatchEvent(new CustomEvent('btc_miner_pref_change', { detail: updated }));
      }
      return updated;
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
      const fallback: UserPreferences = {
        ...(this.memoryCache || DEFAULT_PREFERENCES),
        ...preferences,
        lastUpdated: new Date().toISOString()
      };
      this.memoryCache = fallback;
      return fallback;
    }
  }

  /**
   * Backend-ready async method: Simulates a network request to an API endpoint
   * (e.g. POST /api/user/language) while updating local persistence immediately.
   */
  public async syncWithBackend(language: LanguageCode): Promise<{ success: boolean; data: UserPreferences }> {
    // 1. Immediately persist locally
    const updated = this.savePreferences({ language, isFirstLaunch: false });

    // 2. Mock network latency (100ms) to ensure smooth animations and readiness for real fetch()
    await new Promise((resolve) => setTimeout(resolve, 80));

    // When backend is active, this can simply do:
    // await fetch('/api/user/preferences', { method: 'POST', body: JSON.stringify({ language }) });

    return {
      success: true,
      data: updated
    };
  }

  /**
   * Reset preferences (useful for testing)
   */
  /** Member-scoped preference prevents one member's language leaking to another on shared devices. */
  public getMemberLanguage(id:number): LanguageCode | null {
    try {
      const value=localStorage.getItem('btc_member_language_'+id);
      return value==='en'||value==='es'||value==='pt'?value:null;
    } catch {return null;}
  }

  public saveMemberLanguage(id:number,language:LanguageCode): void {
    try {localStorage.setItem('btc_member_language_'+id,language);}
    catch { /* SQLite and in-memory preference remain available. */ }
    this.savePreferences({language,isFirstLaunch:false});
  }

  public reset(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      this.memoryCache = null;
    }
  }
}

export const storageService = new StorageService();
