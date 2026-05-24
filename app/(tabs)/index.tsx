import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Radius, Shadow } from '../../constants/theme';
import GeoPattern from '../../components/ui/GeoPattern';
import Ornament from '../../components/ui/Ornament';
import Card from '../../components/ui/Card';
import {
  fetchPrayerTimes, PrayerTimes, timeToMinutes, fmtCountdown,
  PRAYER_NAMES, HIJRI_MONTHS,
} from '../../services/prayerApi';
import { saveLocation, getSavedLocation, getLastRead, LastRead, addBookmark } from '../../services/storage';
import { DAILY_AYAT } from '../../constants/quranData';

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
type PrayerKey = typeof PRAYER_ORDER[number];
const PRAYER_ICONS: Record<PrayerKey, string> = {
  Fajr: 'partly-sunny-outline', Dhuhr: 'sunny-outline',
  Asr: 'sunny-outline', Maghrib: 'partly-sunny-outline', Isha: 'moon-outline',
};

function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [city, setCity] = useState('Memuat lokasi...');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nowMin, setNowMin] = useState(getNowMinutes());
  const [lastRead, setLastRead] = useState<LastRead | null>(null);

  // tick every minute
  useEffect(() => {
    const interval = setInterval(() => setNowMin(getNowMinutes()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadLastRead();
    loadData();
  }, []);

  async function loadLastRead() {
    const lr = await getLastRead();
    setLastRead(lr);
  }

  async function loadData(force = false) {
    // Default fallback location (Jakarta) — used when GPS is unavailable
    const FALLBACK = { lat: -6.2088, lng: 106.8456, city: 'Jakarta' };

    try {
      let lat: number, lng: number, cityName: string;
      const saved = await getSavedLocation();

      if (!force && saved) {
        lat = saved.lat; lng = saved.lng; cityName = saved.city;
      } else {
        let located = false;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
            lat = loc.coords.latitude; lng = loc.coords.longitude;
            const geo = await Location.reverseGeocodeAsync({ latitude: lat!, longitude: lng! });
            cityName = geo[0]?.city || geo[0]?.district || geo[0]?.region || 'Jakarta';
            located = true;
          }
        } catch {
          // GPS unavailable — silently fall back, no LogBox warning
        }
        if (!located) {
          lat = FALLBACK.lat; lng = FALLBACK.lng; cityName = FALLBACK.city;
        }
        await saveLocation(lat!, lng!, cityName!);
      }

      setCity(cityName!);
      const data = await fetchPrayerTimes(lat!, lng!);
      setTimes(data);
    } catch (e) {
      // Prayer API failed — show last known city but clear times
      setCity((c) => c || FALLBACK.city);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, []);

  // Determine next prayer
  const getNextPrayer = () => {
    if (!times) return null;
    for (const key of PRAYER_ORDER) {
      const min = timeToMinutes(times[key as keyof PrayerTimes] as string);
      if (min > nowMin) return { key, name: PRAYER_NAMES[key], time: times[key as keyof PrayerTimes] as string, min };
    }
    // wrap to tomorrow Fajr
    return { key: 'Fajr', name: 'Subuh', time: times.Fajr, min: timeToMinutes(times.Fajr) };
  };

  const next = getNextPrayer();
  // When all prayers passed today, getNextPrayer wraps to tomorrow Fajr.
  // next.min will be less than nowMin in that case, so add 24 h.
  const isWrapped = next ? next.min <= nowMin : false;
  const remaining = next
    ? isWrapped ? 1440 - nowMin + next.min : next.min - nowMin
    : 0;
  const prevKey: PrayerKey = !next ? 'Fajr'
    : isWrapped ? 'Isha'
    : PRAYER_ORDER[Math.max(0, PRAYER_ORDER.indexOf(next.key as PrayerKey) - 1)];
  const prevMin = times ? timeToMinutes(times[prevKey as keyof PrayerTimes] as string) : 0;
  const totalPeriod = isWrapped ? (1440 - prevMin) + (next?.min ?? 0) : (next?.min ?? 0) - prevMin;
  const progress = totalPeriod > 0 ? Math.min(1, Math.max(0, (nowMin - prevMin) / totalPeriod)) : 0;

  const hijri = times?.date?.hijri;
  const hijriMonthName = hijri ? HIJRI_MONTHS[hijri.month.number] : '';
  const greg = times?.date?.gregorian;
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDay = dayNames[new Date().getDay()];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Memuat jadwal sholat...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* HERO */}
      <LinearGradient
        colors={[Colors.primaryDeep, Colors.primary, Colors.primaryWarm]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
      >
        <GeoPattern color="#fff" opacity={0.075} size={88} />

        {/* Top row */}
        <View style={styles.heroTopRow}>
          <TouchableOpacity style={styles.locationRow} onPress={() => loadData(true)}>
            <Ionicons name="location-outline" size={15} color="rgba(255,255,255,0.92)" />
            <Text style={styles.locationText}>{city}</Text>
            <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/prayer-schedule')}>
              <Ionicons name="notifications-outline" size={16} color="#fff" />
              <View style={styles.badge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.navigate('/(tabs)/menu' as any)}>
              <Ionicons name="settings-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date */}
        <View style={styles.dateBlock}>
          <Text style={styles.dateGreg}>
            {todayDay}, {greg?.day} {greg?.month.en} {greg?.year}
          </Text>
          <Text style={styles.dateHijri}>
            {hijri?.day} {hijriMonthName}{' '}
            <Text style={{ color: Colors.gold }}>{hijri?.year} H</Text>
          </Text>
        </View>

        {/* Next prayer card */}
        {next && (
          <TouchableOpacity
            style={styles.nextCard}
            activeOpacity={0.85}
            onPress={() => router.push('/prayer-schedule')}
          >
            <View style={styles.nextCardRow}>
              <View>
                <Text style={styles.nextLabel}>SHOLAT BERIKUTNYA</Text>
                <View style={styles.nextTimeRow}>
                  <Text style={styles.nextName}>{next.name}</Text>
                  <Text style={styles.nextTime}>{next.time}</Text>
                </View>
                <Text style={styles.nextCountdown}>{fmtCountdown(remaining)}</Text>
              </View>
              <TouchableOpacity
                style={styles.bellCircle}
                onPress={() => router.push('/prayer-schedule')}
              >
                <Ionicons name="notifications-outline" size={17} color={Colors.gold} />
              </TouchableOpacity>
            </View>
            {/* progress */}
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* 5 PRAYERS STRIP */}
      <View style={styles.stripWrapper}>
        <Card pad={0} radius={Radius.xl} style={styles.stripCard}>
          {PRAYER_ORDER.map((key) => {
            const isNext = next?.key === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.stripItem, isNext && styles.stripItemActive]}
                onPress={() => router.push('/prayer-schedule')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={(PRAYER_ICONS[key] as any)}
                  size={18}
                  color={isNext ? Colors.primary : Colors.ink3}
                />
                <Text style={[styles.stripName, isNext && { color: Colors.primaryInk }]}>
                  {PRAYER_NAMES[key]}
                </Text>
                <Text style={[styles.stripTime, isNext && { color: Colors.primary }]}>
                  {times ? (times[key as keyof PrayerTimes] as string) : '--:--'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Card>
      </View>

      {/* QUICK ACTIONS — explicit 2-column rows so sizes are always equal */}
      <SectionLabel title="Lanjutkan" />
      <View style={styles.quickGrid}>
        <View style={styles.quickRow}>
          <QuickAction
            primary
            title={lastRead ? 'Lanjutkan Membaca' : 'Mulai Baca Quran'}
            subtitle={lastRead ? `${lastRead.surahName} · ayat ${lastRead.ayatN}` : 'Al-Fatihah'}
            icon="book-outline"
            progress={lastRead ? lastRead.ayatN / lastRead.totalAyat : 0}
            onPress={() => router.navigate('/(tabs)/quran' as any)}
          />
          <QuickAction
            title="Dzikir Petang"
            subtitle="22 dzikir · ±10 menit"
            icon="ellipse-outline"
            onPress={() => router.navigate('/(tabs)/dzikir' as any)}
          />
        </View>
        <View style={styles.quickRow}>
          <QuickAction
            title="Arah Kiblat"
            subtitle="295° Barat Laut"
            icon="compass-outline"
            onPress={() => router.navigate('/(tabs)/qibla' as any)}
          />
          <QuickAction
            title="Doa Harian"
            subtitle="15 kategori"
            icon="hand-left-outline"
            onPress={() => router.navigate('/(tabs)/dzikir' as any)}
          />
        </View>
      </View>

      {/* AYAT HARI INI */}
      <SectionLabel
        title="Ayat hari ini"
        action={
          <TouchableOpacity onPress={() => Share.share({ message: `${DAILY_AYAT.arab}\n\n"${DAILY_AYAT.translation}"\n\n— ${DAILY_AYAT.surah} : ${DAILY_AYAT.ayat}` })}>
            <Text style={styles.actionText}>Bagikan</Text>
          </TouchableOpacity>
        }
      />
      <View style={styles.px}>
        <Card pad={20} radius={Radius.xxl}>
          <Text style={styles.arabicAyat}>{DAILY_AYAT.arab}</Text>
          <Text style={styles.transAyat}>"{DAILY_AYAT.translation}"</Text>
          <View style={styles.ayatFooter}>
            <View style={styles.ayatRef}>
              <Ornament n={DAILY_AYAT.surahN} size={28} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.ayatSurah}>{DAILY_AYAT.surah}</Text>
                <Text style={styles.ayatAyat}>Ayat {DAILY_AYAT.ayat}</Text>
              </View>
            </View>
            <View style={styles.ayatActions}>
              <TouchableOpacity
                style={styles.ayatActionBtn}
                onPress={() => router.push({ pathname: '/quran-reader', params: { surah: DAILY_AYAT.surahN, ayat: DAILY_AYAT.ayat } })}
              >
                <Ionicons name="play-outline" size={16} color={Colors.ink2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ayatActionBtn}
                onPress={() => addBookmark({ surahN: DAILY_AYAT.surahN, surahName: DAILY_AYAT.surah, ayatN: DAILY_AYAT.ayat, note: '' })}
              >
                <Ionicons name="bookmark-outline" size={16} color={Colors.ink2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ayatActionBtn}
                onPress={() => Share.share({ message: `${DAILY_AYAT.arab}\n\n"${DAILY_AYAT.translation}"\n\n— ${DAILY_AYAT.surah} : ${DAILY_AYAT.ayat}` })}
              >
                <Ionicons name="share-outline" size={16} color={Colors.ink2} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </View>

      {/* ASMAUL HUSNA */}
      <SectionLabel title="Asmaul Husna" />
      <View style={styles.px}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/asmaul-husna')}
        >
          <Card pad={18} radius={Radius.xl}>
            <View style={styles.asmaRow}>
              <View style={styles.asmaArabBox}>
                <Text style={styles.asmaArab}>ٱلْقَهَّار</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.asmaLatin}>Al-Qahhar</Text>
                <Text style={styles.asmaMeaning}>Yang Maha Memaksa</Text>
                <Text style={styles.asmaNumber}>Nama ke-15 dari 99 · Lihat semua →</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.ink3} />
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      {/* UPCOMING */}
      <SectionLabel title="Akan datang" />
      <View style={[styles.px, { marginBottom: 12 }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/calendar')}>
        <Card pad={16} radius={Radius.xl} style={styles.upcomingCard}>
          <View style={styles.upcomingDateBox}>
            <Text style={styles.upcomingMonth} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>DZULHIJJAH</Text>
            <Text style={styles.upcomingDay}>10</Text>
            <Text style={styles.upcomingYear}>{hijri?.year} H</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.upcomingTitle}>Idul Adha</Text>
            <Text style={styles.upcomingSub}>
              3 hari lagi · Jumat, 28 Mei 2026
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.ink3} />
        </Card>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function SectionLabel({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={sectionStyles.row}>
      <Text style={sectionStyles.label}>{title.toUpperCase()}</Text>
      {action}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: 22, marginBottom: 10,
  },
  label: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1.2,
    textTransform: 'uppercase', color: Colors.ink3,
  },
});

interface QuickActionProps {
  primary?: boolean;
  title: string;
  subtitle: string;
  icon: string;
  progress?: number;
  onPress?: () => void;
}

function QuickAction({ primary, title, subtitle, icon, progress, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity
      style={[qaStyles.card, primary ? qaStyles.primaryCard : qaStyles.defaultCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {primary && <GeoPattern color="#fff" opacity={0.07} size={56} />}
      <View
        style={[
          qaStyles.iconBox,
          { backgroundColor: primary ? 'rgba(255,255,255,0.18)' : Colors.primarySoft },
        ]}
      >
        <Ionicons name={icon as any} size={17} color={primary ? '#fff' : Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[qaStyles.title, { color: primary ? '#fff' : Colors.ink }]}>{title}</Text>
        <Text style={[qaStyles.subtitle, { color: primary ? 'rgba(255,255,255,0.85)' : Colors.ink3 }]}>
          {subtitle}
        </Text>
        {progress != null && progress > 0 && (
          <View style={qaStyles.progBg}>
            <View style={[qaStyles.progFill, { width: `${progress * 100}%` }]} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const qaStyles = StyleSheet.create({
  card: {
    flex: 1,                    // ← fills equal half-width in the 2-col row
    borderRadius: Radius.xl, padding: 14, minHeight: 96,
    justifyContent: 'space-between', overflow: 'hidden',
    ...Shadow.card,
  },
  primaryCard: {
    backgroundColor: Colors.primary,
    shadowColor: '#1F5F46', shadowOpacity: 0.2, shadowRadius: 14, elevation: 6,
  },
  defaultCard: { backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.line },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13.5, fontWeight: '600', letterSpacing: -0.1, marginTop: 8 },
  subtitle: { fontSize: 11.5, marginTop: 2 },
  progBg: { marginTop: 8, height: 3, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 3 },
  progFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 3 },
});

// ─────────────────────────────────────────────────────────────
// Main styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, gap: 12 },
  loadingText: { color: Colors.ink3, fontSize: 14 },

  hero: {
    paddingBottom: 36, paddingHorizontal: 22,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13.5, fontWeight: '500', color: 'rgba(255,255,255,0.92)' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  headerIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 7, right: 8, width: 7, height: 7,
    borderRadius: 4, backgroundColor: Colors.gold,
  },

  dateBlock: { marginTop: 22 },
  dateGreg: { fontSize: 12.5, fontWeight: '500', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.3 },
  dateHijri: { fontSize: 28, color: '#fff', fontWeight: '300', marginTop: 4 },

  nextCard: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22, padding: 16,
  },
  nextCardRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  nextLabel: { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, fontWeight: '600' },
  nextTimeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 },
  nextName: { fontSize: 28, color: '#fff', fontWeight: '400' },
  nextTime: { fontSize: 26, color: '#fff', fontWeight: '300', fontVariant: ['tabular-nums'] },
  nextCountdown: { fontSize: 13, marginTop: 4, color: 'rgba(255,255,255,0.82)' },
  bellCircle: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  progressBg: { marginTop: 14, height: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 4 },

  stripWrapper: { paddingHorizontal: 16, marginTop: -22 },
  stripCard: { flexDirection: 'row', padding: 12, justifyContent: 'space-between' },
  stripItem: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 16 },
  stripItemActive: { backgroundColor: Colors.primarySoft },
  stripName: { fontSize: 10.5, fontWeight: '500', color: Colors.ink3 },
  stripTime: { fontSize: 12.5, fontWeight: '600', color: Colors.ink, fontVariant: ['tabular-nums'] },

  px: { paddingHorizontal: 16 },
  quickGrid: { paddingHorizontal: 16, gap: 10 },
  quickRow: { flexDirection: 'row', gap: 10 },
  actionText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },

  arabicAyat: { fontSize: 24, lineHeight: 48, textAlign: 'right', color: Colors.ink, fontFamily: 'serif', writingDirection: 'rtl' },
  transAyat: { marginTop: 14, fontSize: 14, lineHeight: 22, color: Colors.ink2, textAlign: 'center' },
  ayatFooter: { marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: Colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ayatRef: { flexDirection: 'row', alignItems: 'center' },
  ayatSurah: { fontSize: 12.5, fontWeight: '600', color: Colors.ink },
  ayatAyat: { fontSize: 11, color: Colors.ink3 },
  ayatActions: { flexDirection: 'row', gap: 6 },
  ayatActionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center' },

  asmaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  asmaArabBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  asmaArab: { fontSize: 26, color: Colors.primary, fontFamily: 'serif', fontWeight: '600' },
  asmaLatin: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  asmaMeaning: { fontSize: 12.5, color: Colors.ink2, marginTop: 2 },
  asmaNumber: { fontSize: 11, color: Colors.ink3, marginTop: 2 },

  upcomingCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.goldSoft },
  upcomingDateBox: { width: 54, alignItems: 'center', paddingVertical: 8, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.line },
  upcomingMonth: { fontSize: 10, color: Colors.ink3, fontWeight: '600', letterSpacing: 0.5 },
  upcomingDay: { fontSize: 22, color: Colors.ink, fontWeight: '300' },
  upcomingYear: { fontSize: 10, color: Colors.ink3, marginTop: 2 },
  upcomingTitle: { fontSize: 14.5, fontWeight: '600', color: Colors.ink },
  upcomingSub: { fontSize: 12, color: Colors.ink2, marginTop: 2 },
});
