export const SURAHS = [
  { n: 1, arab: 'ٱلْفَاتِحَة', latin: 'Al-Fatihah', meaning: 'Pembukaan', ayat: 7, type: 'Makkiyah', juz: 1 },
  { n: 2, arab: 'ٱلْبَقَرَة', latin: 'Al-Baqarah', meaning: 'Sapi Betina', ayat: 286, type: 'Madaniyah', juz: 1 },
  { n: 3, arab: 'آلِ عِمْرَان', latin: 'Ali Imran', meaning: "Keluarga 'Imran", ayat: 200, type: 'Madaniyah', juz: 3 },
  { n: 4, arab: 'ٱلنِّسَاء', latin: 'An-Nisa', meaning: 'Wanita', ayat: 176, type: 'Madaniyah', juz: 4 },
  { n: 5, arab: 'ٱلْمَائِدَة', latin: "Al-Ma'idah", meaning: 'Hidangan', ayat: 120, type: 'Madaniyah', juz: 6 },
  { n: 6, arab: 'ٱلْأَنْعَام', latin: "Al-An'am", meaning: 'Binatang Ternak', ayat: 165, type: 'Makkiyah', juz: 7 },
  { n: 7, arab: 'ٱلْأَعْرَاف', latin: "Al-A'raf", meaning: 'Tempat Tertinggi', ayat: 206, type: 'Makkiyah', juz: 8 },
  { n: 8, arab: 'ٱلْأَنْفَال', latin: 'Al-Anfal', meaning: 'Rampasan Perang', ayat: 75, type: 'Madaniyah', juz: 9 },
  { n: 9, arab: 'ٱلتَّوْبَة', latin: 'At-Taubah', meaning: 'Pengampunan', ayat: 129, type: 'Madaniyah', juz: 10 },
  { n: 10, arab: 'يُونُس', latin: 'Yunus', meaning: 'Nabi Yunus', ayat: 109, type: 'Makkiyah', juz: 11 },
  { n: 11, arab: 'هُود', latin: 'Hud', meaning: 'Nabi Hud', ayat: 123, type: 'Makkiyah', juz: 11 },
  { n: 12, arab: 'يُوسُف', latin: 'Yusuf', meaning: 'Nabi Yusuf', ayat: 111, type: 'Makkiyah', juz: 12 },
  { n: 13, arab: 'ٱلرَّعْد', latin: "Ar-Ra'd", meaning: 'Guruh', ayat: 43, type: 'Madaniyah', juz: 13 },
  { n: 14, arab: 'إِبْرَاهِيم', latin: 'Ibrahim', meaning: 'Nabi Ibrahim', ayat: 52, type: 'Makkiyah', juz: 13 },
  { n: 15, arab: 'ٱلْحِجْر', latin: 'Al-Hijr', meaning: 'Daerah Berbatu', ayat: 99, type: 'Makkiyah', juz: 14 },
  { n: 16, arab: 'ٱلنَّحْل', latin: 'An-Nahl', meaning: 'Lebah', ayat: 128, type: 'Makkiyah', juz: 14 },
  { n: 17, arab: 'ٱلْإِسْرَاء', latin: "Al-Isra'", meaning: 'Perjalanan Malam', ayat: 111, type: 'Makkiyah', juz: 15 },
  { n: 18, arab: 'ٱلْكَهْف', latin: 'Al-Kahf', meaning: 'Gua', ayat: 110, type: 'Makkiyah', juz: 15 },
  { n: 19, arab: 'مَرْيَم', latin: 'Maryam', meaning: 'Maryam', ayat: 98, type: 'Makkiyah', juz: 16 },
  { n: 20, arab: 'طه', latin: 'Ta-Ha', meaning: 'Ta Ha', ayat: 135, type: 'Makkiyah', juz: 16 },
  { n: 36, arab: 'يس', latin: 'Ya-Sin', meaning: 'Ya Sin', ayat: 83, type: 'Makkiyah', juz: 22 },
  { n: 55, arab: 'ٱلرَّحْمَٰن', latin: 'Ar-Rahman', meaning: 'Yang Maha Pengasih', ayat: 78, type: 'Madaniyah', juz: 27 },
  { n: 56, arab: 'ٱلْوَاقِعَة', latin: "Al-Waqi'ah", meaning: 'Hari Kiamat', ayat: 96, type: 'Makkiyah', juz: 27 },
  { n: 67, arab: 'ٱلْمُلْك', latin: 'Al-Mulk', meaning: 'Kerajaan', ayat: 30, type: 'Makkiyah', juz: 29 },
  { n: 78, arab: 'ٱلنَّبَإ', latin: "An-Naba'", meaning: 'Berita Besar', ayat: 40, type: 'Makkiyah', juz: 30 },
  { n: 112, arab: 'ٱلْإِخْلَاص', latin: 'Al-Ikhlas', meaning: 'Ikhlas', ayat: 4, type: 'Makkiyah', juz: 30 },
  { n: 113, arab: 'ٱلْفَلَق', latin: 'Al-Falaq', meaning: 'Waktu Subuh', ayat: 5, type: 'Makkiyah', juz: 30 },
  { n: 114, arab: 'ٱلنَّاس', latin: 'An-Nas', meaning: 'Manusia', ayat: 6, type: 'Makkiyah', juz: 30 },
];

export const JUZ_LIST = Array.from({ length: 30 }, (_, i) => ({
  n: i + 1,
  start: i === 0 ? 'Al-Fatihah 1' : `Juz ${i + 1}`,
  description: i === 0 ? 'Al-Fatihah – Al-Baqarah 141' : `Bagian ${i + 1}`,
}));

export const DAILY_AYAT = {
  arab: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
  translation: 'Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.',
  surah: 'Al-Baqarah',
  surahN: 2,
  ayat: 286,
};
