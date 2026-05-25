import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Shadow } from '../constants/theme';
import GeoPattern from '../components/ui/GeoPattern';
import { fetchPrayerTimes, PrayerTimes, timeToMinutes, fmtCountdown, HIJRI_MONTHS } from '../services/prayerApi';
import { getSavedLocation } from '../services/storage';

const FULL_PRAYERS = [
  { key: 'Imsak',   name: 'Imsak',  icon: 'moon-outline' },
  { key: 'Fajr',    name: 'Subuh',  icon: 'partly-sunny-outline' },
  { key: 'Sunrise', name: 'Terbit', icon: 'sunny-outline' },
  { key: 'Dhuhr',   name: 'Dzuhur', icon: 'sunny-outline' },
  { key: 'Asr',     name: 'Ashar',  icon: 'sunny-outline' },
  { key: 'Maghrib', name: 'Maghrib',icon: 'partly-sunny-outline' },
  { key: 'Isha',    name: 'Isya',   icon: 'moon-outline' },
] as const;

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAY_NAMES  = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getDayLabel(date: Date): string {
  const today = new Date();
  if (isSameDay(date, today)) return 'Hari ini';
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Kemarin';
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (isSameDay(date, tomorrow)) return 'Besok';
  return DAY_NAMES[date.getDay()];
}

function getNowMin() {
  const n = new Date(); return n.getHours() * 60 + n.getMinutes();
}

export default function PrayerScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [nowMin] = useState(getNowMin());
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    Fajr: true, Dhuhr: false, Asr: true, Maghrib: true, Isha: true,
  });

  const load = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const saved = await getSavedLocation();
      const lat = saved?.lat ?? -6.2088;
      const lng = saved?.lng ?? 106.8456;
      setCity(saved?.city ?? 'Jakarta');
      const data = await fetchPrayerTimes(lat, lng, 20, date);
      setTimes(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(selectedDate); }, [selectedDate]);

  function prevDay() {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() - 1);
      return next;
    });
  }

  function nextDay() {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      return next;
    });
  }

  // Only highlight "next prayer" on today's schedule
  const isToday = isSameDay(selectedDate, new Date());
  const getNextKey = () => {
    if (!times || !isToday) return null;
    for (const p of FULL_PRAYERS) {
      if (p.key === 'Imsak' || p.key === 'Sunrise') continue;
      const min = timeToMinutes(times[p.key as keyof PrayerTimes] as string);
      if (min > nowMin) return p.key;
    }
    return 'Fajr';
  };
  const nextKey = getNextKey();
  const nextP = nextKey ? FULL_PRAYERS.find((p) => p.key === nextKey) : null;
  const remaining = times && nextP ? timeToMinutes(times[nextP.key as keyof PrayerTimes] as string) - nowMin : 0;

  const hijri = times?.date?.hijri;
  const hijriMonthName = hijri ? HIJRI_MONTHS[hijri.month.number] : '';

  // Formatted date from selectedDate (don't rely solely on API response)
  const dateLine = `${selectedDate.getDate()} ${MONTHS_ID[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  const dayLabel = getDayLabel(selectedDate);

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Jadwal Sholat</Text>
          <Text style={s.headerSub}>
            {DAY_NAMES[selectedDate.getDay()]} · {hijri?.day} {hijriMonthName} {hijri?.year}
          </Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/calendar')}>
          <Ionicons name="calendar-outline" size={20} color={Colors.ink2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Location pill */}
        <View style={s.locPill}>
          <Ionicons name="location-outline" size={15} color={Colors.primary} />
          <Text style={s.locText}>{city}, Indonesia</Text>
          <Text style={s.locMethod}>Kemenag RI</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.ink3} />
        </View>

        {/* Date navigation */}
        <View style={s.dateNav}>
          <TouchableOpacity style={s.navBtn} onPress={prevDay} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={Colors.ink2} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.dateText}>{dateLine}</Text>
            <Text style={s.todayLabel}>{dayLabel}</Text>
          </View>
          <TouchableOpacity style={s.navBtn} onPress={nextDay} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={20} color={Colors.ink2} />
          </TouchableOpacity>
        </View>

        {/* Prayer list */}
        <View style={s.prayerList}>
          {FULL_PRAYERS.map((p) => {
            const isNext = p.key === nextKey;
            const timeStr = times ? (times[p.key as keyof PrayerTimes] as string) : '--:--';
            const notifOn = notifications[p.key as string];

            if (isNext) {
              return (
                <LinearGradient
                  key={p.key}
                  colors={[Colors.primaryDeep, Colors.primary]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[s.prayerRow, s.prayerRowActive, Shadow.strong]}
                >
                  <GeoPattern color="#fff" opacity={0.07} size={64} />
                  <View style={[s.prayerIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                    <Ionicons name={p.icon as any} size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.prayerName, { color: '#fff' }]}>{p.name}</Text>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                      {fmtCountdown(remaining)}
                    </Text>
                  </View>
                  <Text style={[s.prayerTime, { color: '#fff' }]}>{timeStr}</Text>
                  <TouchableOpacity style={[s.notifBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                    <Ionicons name="notifications" size={15} color={Colors.gold} />
                  </TouchableOpacity>
                </LinearGradient>
              );
            }

            return (
              <View key={p.key} style={[s.prayerRow, Shadow.card]}>
                <View style={[s.prayerIcon, { backgroundColor: Colors.primarySoft }]}>
                  <Ionicons name={p.icon as any} size={18} color={Colors.primary} />
                </View>
                <Text style={[s.prayerName, { flex: 1 }]}>{p.name}</Text>
                <Text style={s.prayerTime}>{timeStr}</Text>
                <TouchableOpacity
                  style={[s.notifBtn, { backgroundColor: Colors.chip }]}
                  onPress={() =>
                    setNotifications((prev) => ({ ...prev, [p.key]: !prev[p.key as string] }))
                  }
                >
                  <Ionicons
                    name={notifOn ? 'notifications' : 'notifications-off-outline'}
                    size={15}
                    color={notifOn ? Colors.primary : Colors.ink3}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Bottom actions */}
        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/monthly-schedule')}>
            <Ionicons name="calendar-outline" size={16} color={Colors.ink} />
            <Text style={s.actionBtnText}>Jadwal Bulanan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.navigate('/(tabs)/menu' as any)}>
            <Ionicons name="settings-outline" size={16} color={Colors.ink} />
            <Text style={s.actionBtnText}>Pengaturan</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, gap: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.ink },
  headerSub: { fontSize: 12, color: Colors.ink3, marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center' },

  locPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginVertical: 14,
    padding: 10, paddingHorizontal: 14,
    borderRadius: 14, backgroundColor: Colors.chip,
  },
  locText: { fontSize: 13, fontWeight: '500', color: Colors.ink2, flex: 1 },
  locMethod: { fontSize: 11, color: Colors.ink3 },

  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 16,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.chip,
    alignItems: 'center', justifyContent: 'center',
  },
  dateText: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  todayLabel: { fontSize: 11.5, color: Colors.primary, fontWeight: '500', marginTop: 2 },

  prayerList: { paddingHorizontal: 16, gap: 8 },
  prayerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, paddingHorizontal: 16, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.line,
    overflow: 'hidden',
  },
  prayerRowActive: { borderWidth: 0 },
  prayerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  prayerName: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  prayerTime: { fontSize: 22, fontWeight: '300', color: Colors.ink, fontVariant: ['tabular-nums'] },
  notifBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 14, borderRadius: 14, backgroundColor: Colors.chip,
  },
  actionBtnText: { fontSize: 13.5, fontWeight: '600', color: Colors.ink },
});
