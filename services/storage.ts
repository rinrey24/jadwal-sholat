import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  LAST_READ: 'quran_last_read',
  BOOKMARKS: 'quran_bookmarks',
  PRAYER_SETTINGS: 'prayer_settings',
  TASBIH_TOTAL: 'tasbih_total_today',
  TASBIH_DATE: 'tasbih_date',
  LOCATION: 'last_location',
  DZIKIR_PROGRESS: 'dzikir_progress',
  APP_SETTINGS: 'app_settings',
  ONBOARDING_DONE: 'onboarding_done',
};

export interface LastRead {
  surahN: number;
  surahName: string;
  ayatN: number;
  totalAyat: number;
}

export interface Bookmark {
  id: string;
  surahN: number;
  surahName: string;
  ayatN: number;
  note: string;
  timestamp: number;
}

export interface PrayerSettings {
  method: number; // 20 = Kemenag RI
  school: number; // 1 = Hanafi, 0 = Shafi
  location?: { lat: number; lng: number; city: string };
}

// Last Read
export async function saveLastRead(data: LastRead) {
  await AsyncStorage.setItem(KEYS.LAST_READ, JSON.stringify(data));
}

export async function getLastRead(): Promise<LastRead | null> {
  const v = await AsyncStorage.getItem(KEYS.LAST_READ);
  return v ? JSON.parse(v) : null;
}

// Bookmarks
export async function getBookmarks(): Promise<Bookmark[]> {
  const v = await AsyncStorage.getItem(KEYS.BOOKMARKS);
  return v ? JSON.parse(v) : [];
}

export async function addBookmark(bm: Omit<Bookmark, 'id' | 'timestamp'>) {
  const existing = await getBookmarks();
  const newBm: Bookmark = { ...bm, id: `${bm.surahN}_${bm.ayatN}`, timestamp: Date.now() };
  const filtered = existing.filter((b) => b.id !== newBm.id);
  await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify([newBm, ...filtered]));
}

export async function removeBookmark(id: string) {
  const existing = await getBookmarks();
  await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(existing.filter((b) => b.id !== id)));
}

export async function isBookmarked(surahN: number, ayatN: number): Promise<boolean> {
  const bms = await getBookmarks();
  return bms.some((b) => b.surahN === surahN && b.ayatN === ayatN);
}

// Prayer settings
export async function savePrayerSettings(s: PrayerSettings) {
  await AsyncStorage.setItem(KEYS.PRAYER_SETTINGS, JSON.stringify(s));
}

export async function getPrayerSettings(): Promise<PrayerSettings> {
  const v = await AsyncStorage.getItem(KEYS.PRAYER_SETTINGS);
  return v ? JSON.parse(v) : { method: 20, school: 1 };
}

// Tasbih today count
export async function getTasbihTotal(): Promise<number> {
  const date = new Date().toDateString();
  const savedDate = await AsyncStorage.getItem(KEYS.TASBIH_DATE);
  if (savedDate !== date) {
    await AsyncStorage.setItem(KEYS.TASBIH_DATE, date);
    await AsyncStorage.setItem(KEYS.TASBIH_TOTAL, '0');
    return 0;
  }
  const v = await AsyncStorage.getItem(KEYS.TASBIH_TOTAL);
  return v ? parseInt(v) : 0;
}

export async function addTasbihCount(n: number) {
  const current = await getTasbihTotal();
  const date = new Date().toDateString();
  await AsyncStorage.setItem(KEYS.TASBIH_DATE, date);
  await AsyncStorage.setItem(KEYS.TASBIH_TOTAL, String(current + n));
}

// Saved location
export async function saveLocation(lat: number, lng: number, city: string) {
  await AsyncStorage.setItem(KEYS.LOCATION, JSON.stringify({ lat, lng, city }));
}

export async function getSavedLocation(): Promise<{ lat: number; lng: number; city: string } | null> {
  const v = await AsyncStorage.getItem(KEYS.LOCATION);
  return v ? JSON.parse(v) : null;
}

// ─── App Settings ────────────────────────────────────────────────────────────
export interface AppSettings {
  fontSize: 'small' | 'medium' | 'large';
  quranFontSize: number;
  notifications: boolean;
  prayerNotify: Record<'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha', boolean>;
  notifyMinutes: number;    // 0 | 5 | 10 | 15
  adzanSound: 'default' | 'makkah' | 'madinah' | 'silent';
  vibration: boolean;
  calcMethod: number;       // aladhan method number
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 'medium',
  quranFontSize: 24,
  notifications: true,
  prayerNotify: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
  notifyMinutes: 5,
  adzanSound: 'default',
  vibration: true,
  calcMethod: 20,
};

export async function getAppSettings(): Promise<AppSettings> {
  const v = await AsyncStorage.getItem(KEYS.APP_SETTINGS);
  return v ? { ...DEFAULT_SETTINGS, ...JSON.parse(v) } : DEFAULT_SETTINGS;
}

export async function saveAppSettings(patch: Partial<AppSettings>) {
  const current = await getAppSettings();
  await AsyncStorage.setItem(KEYS.APP_SETTINGS, JSON.stringify({ ...current, ...patch }));
}

// ─── Dzikir progress ─────────────────────────────────────────────────────────
// Dzikir progress
export async function saveDzikirProgress(categoryId: string, progress: number) {
  const date = new Date().toDateString();
  const key = `${KEYS.DZIKIR_PROGRESS}_${categoryId}_${date}`;
  await AsyncStorage.setItem(key, String(progress));
}

export async function getDzikirProgress(categoryId: string): Promise<number> {
  const date = new Date().toDateString();
  const key = `${KEYS.DZIKIR_PROGRESS}_${categoryId}_${date}`;
  const v = await AsyncStorage.getItem(key);
  return v ? parseInt(v) : 0;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export async function isOnboardingDone(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return v === 'true';
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}
