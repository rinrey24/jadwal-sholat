# Muslim App — Panduan Ibadah Harian

<p align="center">
  <img src="assets/icon.png" width="100" alt="Muslim App Icon" />
</p>

<p align="center">
  Aplikasi Muslim lengkap berbasis React Native & Expo untuk Android.<br/>
  Jadwal Sholat · Al-Qur'an · Arah Kiblat · Dzikir · Tasbih · Asmaul Husna · Kalender Hijriyah
</p>

---

## Fitur Utama

| Fitur | Keterangan |
|---|---|
| **Jadwal Sholat** | Waktu sholat akurat berdasarkan lokasi GPS, metode Kemenag RI, navigasi hari sebelum/sesudah |
| **Al-Qur'an** | 114 surah lengkap, terjemahan Bahasa Indonesia, bookmark ayat favorit |
| **Arah Kiblat** | Kompas digital berbasis sensor magnetometer |
| **Dzikir & Doa** | Dzikir pagi/petang, doa harian per kategori, Tasbih digital dengan haptic feedback |
| **Asmaul Husna** | 99 nama Allah lengkap dengan arti dan penjelasan |
| **Kalender Hijriyah** | Konversi tanggal Masehi–Hijriyah |
| **Onboarding** | Layar pengantar 3 slide pada peluncuran pertama |

---

## Tech Stack

- **Framework**: [Expo](https://expo.dev) SDK 56 (React Native 0.85)
- **Routing**: expo-router (file-based routing)
- **Language**: TypeScript
- **Animasi**: react-native-reanimated v4
- **Storage**: @react-native-async-storage/async-storage
- **Sensor**: expo-sensors (magnetometer untuk kiblat)
- **Notifikasi**: expo-notifications
- **API Sholat**: [aladhan.com](https://aladhan.com/prayer-times-api) (method 20 = Kemenag RI)

---

## Cara Setup & Menjalankan (Development)

### Prasyarat

- Node.js 18+ dan npm
- [Expo Go](https://expo.dev/client) di smartphone Android
- (Opsional) Android Studio untuk emulator

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/rinrey24/jadwal-sholat.git
cd jadwal-sholat

# 2. Install dependencies
npm install

# 3. Jalankan development server
npm start
# atau
npx expo start
```

Scan QR code yang muncul di terminal menggunakan aplikasi **Expo Go** di smartphone Anda.

### Perintah Berguna

```bash
# Jalankan di Android (emulator / device)
npm run android

# Jalankan di iOS (macOS + Xcode required)
npm run ios

# Jalankan di browser (terbatas)
npm run web
```

---

## Cara Build APK (Production)

Build menggunakan **EAS Build** (Expo Application Services).

### Prasyarat Build

- Akun Expo (daftar gratis di [expo.dev](https://expo.dev))
- EAS CLI terinstall:
  ```bash
  npm install -g eas-cli
  ```

### Langkah Build

```bash
# 1. Login ke akun Expo
eas login

# 2. Konfigurasi project (hanya pertama kali)
eas build:configure

# 3. Build APK untuk Android
eas build --platform android --profile production
```

Build akan berjalan di cloud EAS. Setelah selesai (~10–20 menit), link download APK akan dikirim ke email dan tersedia di [expo.dev/accounts](https://expo.dev/accounts).

### Profile Build

File `eas.json` mengandung dua profile:

| Profile | Tipe | Kegunaan |
|---|---|---|
| `development` | development | Testing dengan Expo Dev Client |
| `production` | apk | APK siap distribusi (sideload / Play Store) |

---

## Struktur Proyek

```
muslim-app/
├── app/                    # Screens (expo-router)
│   ├── _layout.tsx         # Root layout & navigation stack
│   ├── index.tsx           # Splash router (cek onboarding)
│   ├── onboarding.tsx      # Layar onboarding (3 slide)
│   ├── prayer-schedule.tsx # Jadwal sholat lengkap
│   ├── quran-reader.tsx    # Pembaca Al-Qur'an
│   ├── calendar.tsx        # Kalender Hijriyah
│   ├── dzikir-detail.tsx   # Detail dzikir/doa
│   ├── asmaul-husna.tsx    # 99 Asmaul Husna
│   ├── tasbih.tsx          # Tasbih digital
│   └── (tabs)/             # Tab navigasi utama
│       ├── _layout.tsx     # Tab bar layout
│       ├── index.tsx       # Beranda
│       ├── quran.tsx       # Al-Qur'an (daftar surah)
│       ├── qibla.tsx       # Arah Kiblat
│       ├── dzikir.tsx      # Dzikir & Doa
│       └── menu.tsx        # Pengaturan & Info
├── components/             # Komponen reusable
│   ├── ui/                 # Card, Modal, GeoPattern, Ornament
│   ├── TasbihContent.tsx
│   └── AsmaulHusnaContent.tsx
├── constants/              # Data statis
│   ├── theme.ts            # Warna, font, shadow
│   ├── quranData.ts        # Metadata 114 surah
│   └── dzikirData.ts       # Data dzikir & doa
├── services/               # Logic & API
│   ├── prayerApi.ts        # Fetch waktu sholat (aladhan.com)
│   ├── quranApi.ts         # Fetch data Al-Qur'an
│   └── storage.ts          # AsyncStorage helpers
└── assets/                 # Icon, splash, gambar
```

---

## Konfigurasi Lokasi

Aplikasi otomatis menggunakan GPS device untuk jadwal sholat dan arah kiblat. Jika GPS tidak tersedia, default ke koordinat **Jakarta** (-6.2088, 106.8456).

---

## Lisensi

MIT License — bebas digunakan dan dimodifikasi untuk keperluan pribadi maupun pendidikan.

---

<p align="center">Semoga bermanfaat · بارك الله فيكم</p>
