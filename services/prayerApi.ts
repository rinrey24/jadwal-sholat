// Prayer times via aladhan.com API (free, no key required)
export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  date: {
    readable: string;
    hijri: {
      date: string;
      day: string;
      month: { number: number; en: string; ar: string };
      year: string;
      weekday: { en: string; ar: string };
    };
    gregorian: {
      date: string;
      day: string;
      month: { number: number; en: string };
      year: string;
      weekday: { en: string };
    };
  };
}

export async function fetchPrayerTimes(lat: number, lng: number, method = 20, date?: Date): Promise<PrayerTimes> {
  const d = date ?? new Date();
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=${method}&school=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch prayer times');
  const json = await res.json();

  return {
    ...json.data.timings,
    date: json.data.date,
  };
}

export async function fetchMonthlyPrayerTimes(lat: number, lng: number, month: number, year: number, method = 20) {
  const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=${method}&school=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch monthly prayer times');
  const json = await res.json();
  return json.data as Array<{ timings: PrayerTimes; date: PrayerTimes['date'] }>;
}

export async function fetchHijriCalendar(month: number, year: number) {
  const url = `https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch hijri calendar');
  const json = await res.json();
  return json.data;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fmtCountdown(totalMins: number): string {
  if (totalMins <= 0) return 'Segera';
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m} menit lagi`;
  if (m === 0) return `${h} jam lagi`;
  return `${h} jam ${m} menit lagi`;
}

export const PRAYER_NAMES: Record<string, string> = {
  Imsak: 'Imsak',
  Fajr: 'Subuh',
  Sunrise: 'Terbit',
  Dhuhr: 'Dzuhur',
  Asr: 'Ashar',
  Maghrib: 'Maghrib',
  Isha: 'Isya',
};

export const HIJRI_MONTHS: Record<number, string> = {
  1: 'Muharram', 2: 'Shafar', 3: 'Rabiul Awal', 4: 'Rabiul Akhir',
  5: 'Jumadal Ula', 6: 'Jumadal Akhirah', 7: 'Rajab', 8: "Sya'ban",
  9: 'Ramadhan', 10: 'Syawal', 11: "Dzulqa'dah", 12: 'Dzulhijjah',
};

export const HIJRI_EVENTS: Record<string, { month: number; day: number; label: string; desc: string }[]> = {
  '1-1': [{ month: 1, day: 1, label: 'Tahun Baru Hijriah', desc: 'Awal bulan Muharram' }],
  '1-10': [{ month: 1, day: 10, label: "Hari 'Asyura", desc: 'Puasa Asyura sangat dianjurkan' }],
  '3-12': [{ month: 3, day: 12, label: 'Maulid Nabi SAW', desc: 'Kelahiran Nabi Muhammad SAW' }],
  '7-27': [{ month: 7, day: 27, label: "Isra' Mi'raj", desc: 'Perjalanan malam Nabi SAW' }],
  '8-15': [{ month: 8, day: 15, label: 'Nisfu Sya\'ban', desc: 'Pertengahan Sya\'ban' }],
  '9-1': [{ month: 9, day: 1, label: 'Awal Ramadhan', desc: 'Mulai puasa Ramadhan' }],
  '9-17': [{ month: 9, day: 17, label: 'Nuzulul Quran', desc: 'Peringatan turunnya Al-Quran' }],
  '10-1': [{ month: 10, day: 1, label: 'Idul Fitri', desc: 'Hari Raya Lebaran' }],
  '12-9': [{ month: 12, day: 9, label: 'Hari Arafah', desc: 'Puasa Arafah sangat dianjurkan' }],
  '12-10': [{ month: 12, day: 10, label: 'Idul Adha', desc: 'Hari Raya Kurban' }],
  '12-11': [{ month: 12, day: 11, label: 'Hari Tasyrik', desc: 'Larangan berpuasa' }],
  '12-12': [{ month: 12, day: 12, label: 'Hari Tasyrik', desc: 'Larangan berpuasa' }],
  '12-13': [{ month: 12, day: 13, label: 'Hari Tasyrik', desc: 'Larangan berpuasa' }],
};
