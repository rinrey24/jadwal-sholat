import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/theme';
import { fetchMonthlyPrayerTimes } from '../services/prayerApi';
import { getSavedLocation } from '../services/storage';

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_ABBR = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/** Strip the " (+07)" timezone offset returned by aladhan.com */
function stripTz(t: string): string {
  return t ? t.split(' ')[0] : '--:--';
}

type DayEntry = {
  day: number;
  dayAbbr: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

export default function MonthlyScheduleScreen() {
  const insets = useSafeAreaInsets();
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1); // 1–12
  const [year, setYear]   = useState(today.getFullYear());
  const [data, setData]   = useState<DayEntry[]>([]);
  const [city, setCity]   = useState('');
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async (m: number, y: number) => {
    setLoading(true);
    setHasError(false);
    try {
      const saved = await getSavedLocation();
      const lat   = saved?.lat ?? -6.2088;
      const lng   = saved?.lng ?? 106.8456;
      setCity(saved?.city ?? 'Jakarta');

      const raw = await fetchMonthlyPrayerTimes(lat, lng, m, y);
      const entries: DayEntry[] = raw.map((item) => {
        const dayNum = parseInt(item.date.gregorian.day, 10);
        const d = new Date(y, m - 1, dayNum);
        return {
          day: dayNum,
          dayAbbr: DAY_ABBR[d.getDay()],
          fajr:    stripTz(item.timings.Fajr),
          dhuhr:   stripTz(item.timings.Dhuhr),
          asr:     stripTz(item.timings.Asr),
          maghrib: stripTz(item.timings.Maghrib),
          isha:    stripTz(item.timings.Isha),
        };
      });
      setData(entries);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(month, year); }, [month, year]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  }

  const todayDay = today.getDate();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Jadwal Sholat Bulanan</Text>
          {city ? <Text style={s.headerSub}>{city}</Text> : null}
        </View>
      </View>

      {/* ── Month navigation ── */}
      <View style={s.monthNav}>
        <TouchableOpacity style={s.navBtn} onPress={prevMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={Colors.ink2} />
        </TouchableOpacity>
        <Text style={s.monthTitle}>{MONTHS_ID[month - 1]} {year}</Text>
        <TouchableOpacity style={s.navBtn} onPress={nextMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color={Colors.ink2} />
        </TouchableOpacity>
      </View>

      {/* ── Sticky table header ── */}
      <View style={[s.tableRow, s.tableHeaderRow]}>
        <View style={s.dayCell}>
          <Text style={s.colHeader}>Tgl</Text>
        </View>
        <Text style={[s.timeCell, s.colHeader]}>Subuh</Text>
        <Text style={[s.timeCell, s.colHeader]}>Dzuhur</Text>
        <Text style={[s.timeCell, s.colHeader]}>Ashar</Text>
        <Text style={[s.timeCell, s.colHeader]}>Maghrib</Text>
        <Text style={[s.timeCell, s.colHeader]}>Isya</Text>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={s.centerText}>Memuat {MONTHS_ID[month - 1]}…</Text>
        </View>
      ) : hasError ? (
        <View style={s.center}>
          <Ionicons name="wifi-outline" size={44} color={Colors.ink3} />
          <Text style={s.centerText}>Gagal memuat jadwal</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load(month, year)}>
            <Text style={s.retryText}>Coba lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {data.map((entry) => {
            const isToday  = isCurrentMonth && entry.day === todayDay;
            const isFriday = entry.dayAbbr === 'Jum';
            return (
              <View
                key={entry.day}
                style={[
                  s.tableRow,
                  s.dataRow,
                  isToday  && s.todayRow,
                  isFriday && !isToday && s.fridayRow,
                ]}
              >
                <View style={s.dayCell}>
                  <Text style={[s.dayNum,  isToday && s.todayText]}>{entry.day}</Text>
                  <Text style={[s.dayAbbr, isFriday && s.fridayText, isToday && s.todayText]}>
                    {entry.dayAbbr}
                  </Text>
                </View>
                <Text style={[s.timeCell, s.timeText, isToday && s.todayText]}>{entry.fajr}</Text>
                <Text style={[s.timeCell, s.timeText, isToday && s.todayText]}>{entry.dhuhr}</Text>
                <Text style={[s.timeCell, s.timeText, isToday && s.todayText]}>{entry.asr}</Text>
                <Text style={[s.timeCell, s.timeText, isToday && s.todayText]}>{entry.maghrib}</Text>
                <Text style={[s.timeCell, s.timeText, isToday && s.todayText]}>{entry.isha}</Text>
              </View>
            );
          })}
          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, gap: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.chip,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.ink },
  headerSub:   { fontSize: 12, color: Colors.ink3, marginTop: 2 },

  // Month nav
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.chip,
    alignItems: 'center', justifyContent: 'center',
  },
  monthTitle: { fontSize: 15, fontWeight: '600', color: Colors.ink },

  // Table structure
  tableRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  tableHeaderRow: {
    paddingVertical: 10,
    backgroundColor: Colors.chip,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  dataRow: {
    paddingVertical: 9,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  todayRow:  { backgroundColor: Colors.primarySoft },
  fridayRow: { backgroundColor: Colors.goldSoft },

  // Day column (fixed width)
  dayCell: { width: 46, alignItems: 'center', justifyContent: 'center' },
  dayNum:  { fontSize: 14, fontWeight: '600', color: Colors.ink },
  dayAbbr: { fontSize: 10, color: Colors.ink3, marginTop: 1 },

  // Time columns (equal flex)
  timeCell: { flex: 1, textAlign: 'center' },
  colHeader: { fontSize: 10.5, fontWeight: '700', color: Colors.ink3 },
  timeText:  { fontSize: 11.5, color: Colors.ink, fontVariant: ['tabular-nums'] },

  // Highlight modifiers
  todayText:  { color: Colors.primary, fontWeight: '600' },
  fridayText: { color: Colors.gold },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  centerText: { fontSize: 14, color: Colors.ink3 },
  retryBtn: {
    marginTop: 4, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, backgroundColor: Colors.primary,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
