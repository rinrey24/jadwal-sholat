// Quran API via alquran.cloud (free, no key)
const BASE = 'https://api.alquran.cloud/v1';

export interface AyatData {
  number: number;
  numberInSurah: number;
  arab: string;
  translation: string;
  audio: string;
  juz: number;
  page: number;
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export async function fetchSurahList(): Promise<SurahData[]> {
  const res = await fetch(`${BASE}/surah`);
  const json = await res.json();
  return json.data;
}

export async function fetchSurah(surahNumber: number): Promise<AyatData[]> {
  // Fetch Arabic text + Indonesian translation in one request via edition
  const [arabRes, transRes] = await Promise.all([
    fetch(`${BASE}/surah/${surahNumber}/quran-uthmani`),
    fetch(`${BASE}/surah/${surahNumber}/id.indonesian`),
  ]);

  const arabJson = await arabRes.json();
  const transJson = await transRes.json();

  const arabAyat: any[] = arabJson.data.ayahs;
  const transAyat: any[] = transJson.data.ayahs;

  return arabAyat.map((a: any, i: number) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    arab: a.text,
    translation: transAyat[i]?.text || '',
    audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`,
    juz: a.juz,
    page: a.page,
  }));
}

export async function fetchSurahInfo(surahNumber: number): Promise<SurahData> {
  const res = await fetch(`${BASE}/surah/${surahNumber}`);
  const json = await res.json();
  return json.data;
}

// Transliteration is not available in alquran.cloud free, so we use a static set for Al-Fatihah
export const FATIHAH_TRANSLIT = [
  "Bismillāhir-raḥmānir-raḥīm",
  "Al-ḥamdu lillāhi rabbil-'ālamīn",
  "Ar-raḥmānir-raḥīm",
  "Māliki yawmid-dīn",
  "Iyyāka na'budu wa iyyāka nasta'īn",
  "Ihdinaṣ-ṣirāṭal-mustaqīm",
  "Ṣirāṭal-ladhīna an'amta 'alayhim, ghayril-magḍūbi 'alayhim wa laḍ-ḍāllīn",
];
