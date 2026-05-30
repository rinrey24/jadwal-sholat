import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Radius } from '../constants/theme';
import Card from '../components/ui/Card';
import { HIJRI_MONTHS, HIJRI_EVENTS } from '../services/prayerApi';
import { hijriToGregorian, gregorianToHijri, hijriToJDN } from '../services/hijriUtils';

const DOW = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const GREG_MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const GREG_MONTHS_LONG  = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAY_NAMES = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

interface DayCell {
  hijriDay: number;
  gregDay: number;
  gregMonth: string;
  isOther: boolean;
  isActualToday?: boolean; // true only for today's real date
  hasEvent?: boolean;
  eventColor?: string;
  eventLabel?: string;
}

// ─── Date conversion utilities imported from hijriUtils ──────────────────

/** Get today's Hijri day of month (e.g., 10 for 10 Dzulhijjah) */
function computeTodayHijriDay(): number {
  const now = new Date();
  const today = gregorianToHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return today.d;
}

// Event labels for specific days (keyed by Hijri month-day)
const HIJRI_EVENT_MARKERS: Record<string, { color: string; label: string }> = {
  '1-1':   { color: Colors.ink3,  label: 'Tahun Baru Hijriah' },
  '1-10':  { color: Colors.gold,  label: "Asyura" },
  '3-12':  { color: Colors.primary, label: 'Maulid Nabi SAW' },
  '7-27':  { color: Colors.primary, label: "Isra' Mi'raj" },
  '8-15':  { color: Colors.ink3,  label: "Nisfu Sya'ban" },
  '9-1':   { color: Colors.primary, label: 'Awal Ramadhan' },
  '9-17':  { color: Colors.primary, label: 'Nuzulul Quran' },
  '10-1':  { color: Colors.error, label: 'Idul Fitri' },
  '12-8':  { color: Colors.gold,  label: 'Hari Tarwiyah' },
  '12-9':  { color: Colors.gold,  label: 'Hari Arafah' },
  '12-10': { color: Colors.error, label: 'Idul Adha' },
  '12-11': { color: Colors.error, label: 'Hari Tasyrik' },
  '12-12': { color: Colors.error, label: 'Hari Tasyrik' },
  '12-13': { color: Colors.error, label: 'Hari Tasyrik' },
};

// ─── Hijri calendar grid (dynamic for any Hijri month/year) ──────────────
function buildCalendar(hijriMonth: number, hijriYear: number): DayCell[] {
  const days: DayCell[] = [];
  const nowG = new Date();
  const todayG = { y: nowG.getFullYear(), m: nowG.getMonth() + 1, d: nowG.getDate() };

  // First day of this Hijri month as Gregorian
  const firstOfMonth = hijriToGregorian(hijriYear, hijriMonth, 1);
  const firstGregDate = new Date(firstOfMonth.y, firstOfMonth.m - 1, firstOfMonth.d);
  const firstDayOfWeek = firstGregDate.getDay(); // 0=Sun

  // Days in this Hijri month: use JDN difference (accurate for tabular calendar)
  const nextHM = hijriMonth === 12 ? 1 : hijriMonth + 1;
  const nextHY = hijriMonth === 12 ? hijriYear + 1 : hijriYear;
  const daysInMonth = hijriToJDN(nextHY, nextHM, 1) - hijriToJDN(hijriYear, hijriMonth, 1);

  // ── Leading padding (days from previous Hijri month) ─────────────────
  const prevHM = hijriMonth === 1 ? 12 : hijriMonth - 1;
  const prevHY = hijriMonth === 1 ? hijriYear - 1 : hijriYear;
  const prevDays = hijriToJDN(hijriYear, hijriMonth, 1) - hijriToJDN(prevHY, prevHM, 1);
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const hd = prevDays - i;
    const gd = new Date(firstGregDate);
    gd.setDate(gd.getDate() - (firstDayOfWeek - i) + (firstDayOfWeek - i === 0 ? 0 : 0));
    const gDate = new Date(firstGregDate.getTime() - (firstDayOfWeek - i) * 86400000);
    days.push({
      hijriDay: hd,
      gregDay: gDate.getDate(),
      gregMonth: GREG_MONTHS_SHORT[gDate.getMonth()],
      isOther: true,
      isActualToday: gDate.getFullYear() === todayG.y && gDate.getMonth() + 1 === todayG.m && gDate.getDate() === todayG.d,
    });
  }

  // ── Current month days ───────────────────────────────────────────────
  for (let i = 1; i <= daysInMonth; i++) {
    const gDate = new Date(firstGregDate.getTime() + (i - 1) * 86400000);
    const evKey = `${hijriMonth}-${i}`;
    const ev = HIJRI_EVENT_MARKERS[evKey];
    days.push({
      hijriDay: i,
      gregDay: gDate.getDate(),
      gregMonth: GREG_MONTHS_SHORT[gDate.getMonth()],
      isOther: false,
      isActualToday: gDate.getFullYear() === todayG.y && gDate.getMonth() + 1 === todayG.m && gDate.getDate() === todayG.d,
      hasEvent: !!ev,
      eventColor: ev?.color,
      eventLabel: ev?.label,
    });
  }

  // ── Trailing padding (days from next Hijri month) ────────────────────
  let trailing = 1;
  while (days.length < 42) {
    const gDate = new Date(firstGregDate.getTime() + (daysInMonth - 1 + trailing) * 86400000);
    days.push({
      hijriDay: trailing,
      gregDay: gDate.getDate(),
      gregMonth: GREG_MONTHS_SHORT[gDate.getMonth()],
      isOther: true,
      isActualToday: gDate.getFullYear() === todayG.y && gDate.getMonth() + 1 === todayG.m && gDate.getDate() === todayG.d,
    });
    trailing++;
  }

  return days;
}

// ─── Gregorian (Masehi) calendar grid ────────────────────────────────────
function buildMasehiCalendar(gregMonth: number, gregYear: number): DayCell[] {
  const days: DayCell[] = [];
  const nowG = new Date();
  const todayG = { y: nowG.getFullYear(), m: nowG.getMonth() + 1, d: nowG.getDate() };

  const firstDate = new Date(gregYear, gregMonth - 1, 1);
  const firstDayOfWeek = firstDate.getDay();
  const daysInMonth = new Date(gregYear, gregMonth, 0).getDate(); // last day of month

  // Leading padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const gDate = new Date(firstDate.getTime() - (firstDayOfWeek - i) * 86400000);
    const h = gregorianToHijri(gDate.getFullYear(), gDate.getMonth() + 1, gDate.getDate());
    const evKey = `${h.m}-${h.d}`;
    const ev = HIJRI_EVENT_MARKERS[evKey];
    days.push({
      hijriDay: h.d,
      gregDay: gDate.getDate(),
      gregMonth: GREG_MONTHS_SHORT[gDate.getMonth()],
      isOther: true,
      isActualToday: gDate.getFullYear() === todayG.y && gDate.getMonth() + 1 === todayG.m && gDate.getDate() === todayG.d,
      hasEvent: !!ev,
      eventColor: ev?.color,
      eventLabel: ev?.label,
    });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const gDate = new Date(gregYear, gregMonth - 1, i);
    const h = gregorianToHijri(gDate.getFullYear(), gDate.getMonth() + 1, gDate.getDate());
    const evKey = `${h.m}-${h.d}`;
    const ev = HIJRI_EVENT_MARKERS[evKey];
    days.push({
      hijriDay: h.d,
      gregDay: i,
      gregMonth: GREG_MONTHS_SHORT[gregMonth - 1],
      isOther: false,
      isActualToday: gDate.getFullYear() === todayG.y && gDate.getMonth() + 1 === todayG.m && gDate.getDate() === todayG.d,
      hasEvent: !!ev,
      eventColor: ev?.color,
      eventLabel: ev?.label,
    });
  }

  // Trailing padding
  let trailing = 1;
  while (days.length < 42) {
    const gDate = new Date(gregYear, gregMonth - 1, daysInMonth + trailing);
    const h = gregorianToHijri(gDate.getFullYear(), gDate.getMonth() + 1, gDate.getDate());
    const evKey = `${h.m}-${h.d}`;
    const ev = HIJRI_EVENT_MARKERS[evKey];
    days.push({
      hijriDay: h.d,
      gregDay: gDate.getDate(),
      gregMonth: GREG_MONTHS_SHORT[gDate.getMonth()],
      isOther: true,
      isActualToday: false,
      hasEvent: !!ev,
      eventColor: ev?.color,
      eventLabel: ev?.label,
    });
    trailing++;
  }

  return days;
}

// ─── Important dates — computed per selected year ────────────────────────
function computePentingDates(hijriYear: number) {
  return Object.values(HIJRI_EVENTS)
    .flat()
    .sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day)
    .map(ev => {
      const g = hijriToGregorian(hijriYear, ev.month, ev.day);
      const icon = ev.month === 9 ? '🌙'
        : ev.month === 10 ? '🎉'
        : ev.month === 12 && ev.day === 10 ? '🐑'
        : ev.month === 12 && ev.day >= 11 ? '📿'
        : ev.day === 1 && ev.month === 1 ? '🎊'
        : '📅';
      return {
        hijri: `${ev.day} ${HIJRI_MONTHS[ev.month]} ${hijriYear} H`,
        greg: `${g.d} ${GREG_MONTHS_SHORT[g.m - 1]} ${g.y}`,
        label: ev.label,
        desc: ev.desc,
        icon,
      };
    });
}

// ─── Upcoming events ──────────────────────────────────────────────────────────
const ALL_UPCOMING = [
  { startDay: 8, endDay: 8,  h: '8',     label: 'Hari Tarwiyah', sub: 'Jemaah haji menuju Mina',            tone: 'gold' },
  { startDay: 9, endDay: 9,  h: '9',     label: 'Hari Arafah',   sub: 'Puasa Arafah sangat dianjurkan',    tone: 'gold' },
  { startDay: 10, endDay: 10, h: '10',   label: 'Idul Adha',     sub: 'Sholat Ied · Penyembelihan kurban', tone: 'red'  },
  { startDay: 11, endDay: 13, h: '11-13',label: 'Hari Tasyrik',  sub: 'Larangan berpuasa · Takbir',        tone: 'red'  },
];

function getUpcoming(todayDay: number) {
  return ALL_UPCOMING
    .filter(e => e.endDay >= todayDay)
    .map(e => {
      const diff = e.startDay - todayDay;
      const when = diff <= 0 ? 'Hari ini'
        : diff === 1 ? 'Besok'
        : `${diff} hari lagi`;
      return { ...e, when };
    });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const todayHijriDay = computeTodayHijriDay();

  const [calMode, setCalMode] = useState<'hijri' | 'masehi'>('hijri');
  const [selected, setSelected] = useState(todayHijriDay);
  const [selectedHijriMonth, setSelectedHijriMonth] = useState(12);
  const [selectedHijriYear, setSelectedHijriYear] = useState(1447);

  // Masehi calendar state
  const [selectedGregMonth, setSelectedGregMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedGregYear, setSelectedGregYear]   = useState(() => new Date().getFullYear());
  const [selectedGregDay, setSelectedGregDay]     = useState(() => new Date().getDate());

  // Converter modal state
  const [converterVisible, setConverterVisible] = useState(false);
  const [convMode, setConvMode] = useState<'g2h' | 'h2g'>('g2h');
  const [convD, setConvD] = useState('');
  const [convM, setConvM] = useState('');
  const [convY, setConvY] = useState('');
  const [convResult, setConvResult] = useState('');

  // Hari Penting modal state
  const [pentingVisible, setPentingVisible] = useState(false);

  const isHijriMode = calMode === 'hijri';
  const days = isHijriMode
    ? buildCalendar(selectedHijriMonth, selectedHijriYear)
    : buildMasehiCalendar(selectedGregMonth, selectedGregYear);

  const monthHeaderName = isHijriMode
    ? `${HIJRI_MONTHS[selectedHijriMonth]} ${selectedHijriYear} H`
    : `${GREG_MONTHS_LONG[selectedGregMonth - 1]} ${selectedGregYear}`;

  const monthSubName = isHijriMode
    ? `Bulan ${selectedHijriMonth} / 12`
    : `Bulan ${selectedGregMonth} / 12`;

  // Find selected cell
  const selDay = isHijriMode
    ? days.find(d => !d.isOther && d.hijriDay === selected)
    : days.find(d => !d.isOther && d.gregDay === selectedGregDay);

  const upcoming = getUpcoming(todayHijriDay);
  const pentingDates = computePentingDates(selectedHijriYear);

  // Date strings for the "detail" section
  let selHijriStr = '';
  let selGregStr = '';
  if (isHijriMode && selDay) {
    const selGDate = new Date(
      selDay.gregMonth
        ? new Date(`${selDay.gregDay} ${selDay.gregMonth} 2026`).getFullYear()
        : new Date().getFullYear(),
      GREG_MONTHS_SHORT.indexOf(selDay.gregMonth),
      selDay.gregDay,
    );
    // More reliable: compute from Hijri
    const gFull = hijriToGregorian(selectedHijriYear, selectedHijriMonth, selected);
    const gDate = new Date(gFull.y, gFull.m - 1, gFull.d);
    selGregStr = `${DAY_NAMES[gDate.getDay()]} · ${gDate.getDate()} ${GREG_MONTHS_SHORT[gDate.getMonth()]} ${gDate.getFullYear()}`;
    selHijriStr = `${selected} ${HIJRI_MONTHS[selectedHijriMonth]} ${selectedHijriYear} H`;
  } else if (!isHijriMode && selDay) {
    const gDate = new Date(selectedGregYear, selectedGregMonth - 1, selectedGregDay);
    const h = gregorianToHijri(selectedGregYear, selectedGregMonth, selectedGregDay);
    selGregStr = `${DAY_NAMES[gDate.getDay()]} · ${selectedGregDay} ${GREG_MONTHS_SHORT[selectedGregMonth - 1]} ${selectedGregYear}`;
    selHijriStr = `${h.d} ${HIJRI_MONTHS[h.m]} ${h.y} H`;
  }

  function handleConvert() {
    const d = parseInt(convD, 10);
    const m = parseInt(convM, 10);
    const y = parseInt(convY, 10);
    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || m < 1 || m > 12) {
      setConvResult('⚠️ Masukkan tanggal yang valid');
      return;
    }
    try {
      if (convMode === 'g2h') {
        if (d > 31 || y < 622) { setConvResult('⚠️ Tanggal tidak valid'); return; }
        const { y: hy, m: hm, d: hd } = gregorianToHijri(y, m, d);
        setConvResult(`${hd} ${HIJRI_MONTHS[hm] ?? '?'} ${hy} H`);
      } else {
        if (d > 30 || y < 1) { setConvResult('⚠️ Tanggal tidak valid'); return; }
        const { y: gy, m: gm, d: gd } = hijriToGregorian(y, m, d);
        setConvResult(`${gd} ${GREG_MONTHS_LONG[gm - 1] ?? '?'} ${gy}`);
      }
    } catch {
      setConvResult('⚠️ Terjadi kesalahan perhitungan');
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Kalender {isHijriMode ? 'Hijriah' : 'Masehi'}</Text>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.navigate('/(tabs)/menu' as any)}>
          <Ionicons name="settings-outline" size={20} color={Colors.ink2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mode toggle */}
        <View style={s.modeToggleRow}>
          <TouchableOpacity
            style={[s.modeBtn, isHijriMode && s.modeBtnActive]}
            onPress={() => setCalMode('hijri')}
          >
            <Text style={[s.modeBtnText, isHijriMode && s.modeBtnTextActive]}>Hijriah</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modeBtn, !isHijriMode && s.modeBtnActive]}
            onPress={() => setCalMode('masehi')}
          >
            <Text style={[s.modeBtnText, !isHijriMode && s.modeBtnTextActive]}>Masehi</Text>
          </TouchableOpacity>
        </View>

        {/* Month header */}
        <View style={s.monthHeader}>
          <View>
            <Text style={s.monthTitle}>{monthHeaderName}</Text>
            <Text style={s.monthSub}>{monthSubName}</Text>
          </View>
          <View style={s.monthNav}>
            <TouchableOpacity
              style={s.navBtn}
              onPress={() => {
                if (isHijriMode) {
                  if (selectedHijriMonth === 1) {
                    setSelectedHijriMonth(12);
                    setSelectedHijriYear(y => y - 1);
                  } else {
                    setSelectedHijriMonth(m => m - 1);
                  }
                  setSelected(1);
                } else {
                  if (selectedGregMonth === 1) {
                    setSelectedGregMonth(12);
                    setSelectedGregYear(y => y - 1);
                  } else {
                    setSelectedGregMonth(m => m - 1);
                  }
                  setSelectedGregDay(1);
                }
              }}
            >
              <Ionicons name="chevron-back" size={18} color={Colors.ink2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.todayBtn}
              onPress={() => {
                const now = new Date();
                if (isHijriMode) {
                  const today = gregorianToHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
                  setSelectedHijriMonth(today.m);
                  setSelectedHijriYear(today.y);
                  setSelected(today.d);
                } else {
                  setSelectedGregMonth(now.getMonth() + 1);
                  setSelectedGregYear(now.getFullYear());
                  setSelectedGregDay(now.getDate());
                }
              }}
            >
              <Text style={s.todayBtnText}>Hari ini</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.navBtn}
              onPress={() => {
                if (isHijriMode) {
                  if (selectedHijriMonth === 12) {
                    setSelectedHijriMonth(1);
                    setSelectedHijriYear(y => y + 1);
                  } else {
                    setSelectedHijriMonth(m => m + 1);
                  }
                  setSelected(1);
                } else {
                  if (selectedGregMonth === 12) {
                    setSelectedGregMonth(1);
                    setSelectedGregYear(y => y + 1);
                  } else {
                    setSelectedGregMonth(m => m + 1);
                  }
                  setSelectedGregDay(1);
                }
              }}
            >
              <Ionicons name="chevron-forward" size={18} color={Colors.ink2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* DOW header */}
        <View style={s.dowRow}>
          {DOW.map((d, i) => (
            <Text key={d} style={[s.dowLabel, i === 5 && { color: Colors.primary }]}>{d}</Text>
          ))}
        </View>

        {/* Grid */}
        <View style={s.grid}>
          {days.map((d, i) => {
            const isSel = isHijriMode
              ? (!d.isOther && d.hijriDay === selected)
              : (!d.isOther && d.gregDay === selectedGregDay);
            const isToday = !!d.isActualToday;
            const bigNum   = isHijriMode ? d.hijriDay : d.gregDay;
            const smallNum = isHijriMode ? d.gregDay  : d.hijriDay;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  s.dayCell,
                  isSel && s.dayCellSelected,
                  isToday && !isSel && s.dayCellToday,
                ]}
                onPress={() => {
                  if (d.isOther) return;
                  if (isHijriMode) {
                    setSelected(d.hijriDay);
                  } else {
                    setSelectedGregDay(d.gregDay);
                  }
                }}
                disabled={d.isOther}
              >
                <Text style={[
                  s.dayHijri,
                  isSel && { color: '#fff' },
                  isToday && !isSel && { fontWeight: '700' },
                  d.isOther && s.dayOther,
                ]}>
                  {bigNum}
                </Text>
                <Text style={[
                  s.dayGreg,
                  isSel && { color: 'rgba(255,255,255,0.7)' },
                  d.isOther && { opacity: 0.4 },
                ]}>
                  {smallNum}
                </Text>
                {d.hasEvent && (
                  <View style={[s.eventDot, { backgroundColor: isSel ? Colors.gold : d.eventColor }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected detail */}
        <View style={s.sectionLabel}>
          <Text style={s.sectionLabelText}>DETAIL HARI TERPILIH</Text>
        </View>
        <View style={s.px}>
          <Card pad={18} radius={Radius.xl}>
            <View style={s.detailTop}>
              <View>
                <Text style={s.detailHijri}>{selHijriStr || '—'}</Text>
                <Text style={s.detailGreg}>{selGregStr || '—'}</Text>
              </View>
              {selDay?.hasEvent && (
                <View style={s.eventBadge}>
                  <Text style={s.eventBadgeText}>{selDay.eventLabel ?? 'Event'}</Text>
                </View>
              )}
            </View>

            {upcoming.length > 0 && (
              <View style={s.upcomingList}>
                {upcoming.map((e, i) => (
                  <View key={i} style={s.upcomingItem}>
                    <View style={[
                      s.upcomingNumBox,
                      { backgroundColor: e.tone === 'gold' ? Colors.goldSoft : Colors.primarySoft },
                    ]}>
                      <Text style={[
                        s.upcomingNum,
                        { color: e.tone === 'gold' ? Colors.goldInk : Colors.primary },
                      ]}>{e.h}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.upcomingLabel}>{e.label}</Text>
                      <Text style={s.upcomingSub}>{e.sub}</Text>
                    </View>
                    <Text style={s.upcomingWhen}>{e.when}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>

        {/* Tools */}
        <View style={s.sectionLabel}>
          <Text style={s.sectionLabelText}>ALAT</Text>
        </View>
        <View style={s.toolGrid}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => { setConvD(''); setConvM(''); setConvY(''); setConvResult(''); setConverterVisible(true); }}
          >
            <Card pad={14} radius={16} style={{ flex: 1 }}>
              <Ionicons name="refresh-outline" size={18} color={Colors.primary} />
              <Text style={s.toolTitle}>Konverter Tanggal</Text>
              <Text style={s.toolSub}>Hijriah ⇄ Masehi</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => setPentingVisible(true)}
          >
            <Card pad={14} radius={16} style={{ flex: 1 }}>
              <Ionicons name="star-outline" size={18} color={Colors.gold} />
              <Text style={s.toolTitle}>Hari Penting</Text>
              <Text style={s.toolSub}>{pentingDates.length} event tahunan</Text>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Converter Modal ──────────────────────────────────────────────────── */}
      <Modal visible={converterVisible} transparent animationType="slide" onRequestClose={() => setConverterVisible(false)}>
        {/*
          KAV must be the OUTERMOST container so it wraps both the dismiss area
          and the sheet. behavior="padding" adds paddingBottom = keyboard height,
          which pushes the sheet up. TouchableOpacity (flex:1) absorbs the space.
        */}
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
          behavior="padding"
        >
          {/* Tap dim area to dismiss */}
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setConverterVisible(false)} />
          {/* Sheet sits at the bottom of KAV; KAV padding pushes it above keyboard */}
          <View style={cm.sheet}>
            <View style={cm.handle} />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={cm.modalHeader}>
                <Text style={cm.modalTitle}>Konverter Tanggal</Text>
                <TouchableOpacity onPress={() => setConverterVisible(false)}>
                  <Ionicons name="close" size={22} color={Colors.ink} />
                </TouchableOpacity>
              </View>

              {/* Mode tabs */}
              <View style={cm.tabs}>
                {(['g2h', 'h2g'] as const).map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[cm.tab, convMode === mode && cm.tabActive]}
                    onPress={() => { setConvMode(mode); setConvResult(''); }}
                  >
                    <Text style={[cm.tabText, convMode === mode && cm.tabTextActive]}>
                      {mode === 'g2h' ? 'Masehi → Hijriah' : 'Hijriah → Masehi'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={cm.inputLabel}>
                {convMode === 'g2h' ? 'Masukkan tanggal Masehi' : 'Masukkan tanggal Hijriah'}
              </Text>
              <View style={cm.inputRow}>
                <View style={cm.inputWrap}>
                  <Text style={cm.inputHint}>Hari</Text>
                  <TextInput style={cm.input} value={convD} onChangeText={setConvD}
                    keyboardType="numeric" maxLength={2} placeholder="DD" placeholderTextColor={Colors.ink3} />
                </View>
                <View style={cm.inputWrap}>
                  <Text style={cm.inputHint}>Bulan</Text>
                  <TextInput style={cm.input} value={convM} onChangeText={setConvM}
                    keyboardType="numeric" maxLength={2} placeholder="MM" placeholderTextColor={Colors.ink3} />
                </View>
                <View style={[cm.inputWrap, { flex: 1.5 }]}>
                  <Text style={cm.inputHint}>Tahun</Text>
                  <TextInput style={cm.input} value={convY} onChangeText={setConvY}
                    keyboardType="numeric" maxLength={4} placeholder="YYYY" placeholderTextColor={Colors.ink3} />
                </View>
              </View>

              <TouchableOpacity style={cm.convertBtn} onPress={handleConvert}>
                <Text style={cm.convertBtnText}>Konversi</Text>
              </TouchableOpacity>

              {convResult ? (
                <View style={cm.resultBox}>
                  <Text style={cm.resultLabel}>Hasil:</Text>
                  <Text style={cm.resultText}>{convResult}</Text>
                  <Text style={cm.resultNote}>* Kalender aritmetika (±1-2 hari dari observasi)</Text>
                </View>
              ) : null}

              <View style={{ height: insets.bottom + 8 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Hari Penting Modal ───────────────────────────────────────────────── */}
      <Modal visible={pentingVisible} transparent animationType="slide" onRequestClose={() => setPentingVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}>
          {/* Tap dim area to dismiss */}
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setPentingVisible(false)} />
          {/* Plain View — NOT TouchableOpacity — so ScrollView inside can receive scroll gestures */}
          <View style={[cm.sheet, { maxHeight: '85%' }]}>
            <View style={cm.handle} />
            <View style={cm.modalHeader}>
              <Text style={cm.modalTitle}>Hari Penting 1447 H</Text>
              <TouchableOpacity onPress={() => setPentingVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {pentingDates.map((item, i) => (
                <View key={i} style={cm.eventItem}>
                  <Text style={cm.eventIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={cm.eventLabel}>{item.label}</Text>
                    <Text style={cm.eventHijri}>{item.hijri}</Text>
                    <Text style={cm.eventGreg}>≈ {item.greg}</Text>
                    <Text style={cm.eventDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
              <Text style={cm.resultNote}>
                * Tanggal Masehi adalah perkiraan berdasarkan kalender aritmetika.
                Tanggal resmi mengikuti ru'yatul hilal.
              </Text>
              <View style={{ height: insets.bottom + 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: Colors.ink },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center',
  },
  px: { paddingHorizontal: 16 },

  modeToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },
  modeBtn: {
    flex: 1, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.chip,
    borderWidth: 1, borderColor: 'transparent',
  },
  modeBtnActive: {
    backgroundColor: Colors.primary,
  },
  modeBtnText: { fontSize: 13.5, fontWeight: '600', color: Colors.ink2 },
  modeBtnTextActive: { color: '#fff' },

  monthHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  monthTitle: { fontSize: 26, fontWeight: '400', color: Colors.ink },
  monthSub: { fontSize: 12.5, color: Colors.ink3, marginTop: 2 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  navBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center',
  },
  todayBtn: {
    paddingHorizontal: 12, height: 34, borderRadius: 17,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  todayBtnText: { fontSize: 11.5, fontWeight: '600', color: Colors.primary },

  dowRow: { flexDirection: 'row', paddingHorizontal: 14, marginBottom: 4 },
  dowLabel: {
    flex: 1, textAlign: 'center', fontSize: 10.5, fontWeight: '600',
    letterSpacing: 0.5, color: Colors.ink3, textTransform: 'uppercase', paddingVertical: 6,
  },

  grid: { paddingHorizontal: 14, flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`, aspectRatio: 0.95, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 1, padding: 4, position: 'relative',
  },
  dayCellSelected: { backgroundColor: Colors.primary },
  dayCellToday:    { backgroundColor: Colors.primarySoft },
  dayHijri: { fontSize: 15, fontWeight: '500', color: Colors.ink, lineHeight: 18 },
  dayGreg:  { fontSize: 9, color: Colors.ink3, lineHeight: 12 },
  dayOther: { color: Colors.ink4 },
  eventDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2 },

  sectionLabel: { paddingHorizontal: 20, marginTop: 22, marginBottom: 10 },
  sectionLabelText: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, color: Colors.ink3 },

  detailTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  detailHijri: { fontSize: 22, fontWeight: '400', color: Colors.ink },
  detailGreg:  { fontSize: 12.5, color: Colors.ink3, marginTop: 2 },
  eventBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: Colors.goldSoft, maxWidth: 140,
  },
  eventBadgeText: { fontSize: 10.5, fontWeight: '600', color: Colors.goldInk },

  upcomingList: { marginTop: 16, gap: 12 },
  upcomingItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upcomingNumBox: {
    minWidth: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  upcomingNum:   { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  upcomingLabel: { fontSize: 13.5, fontWeight: '600', color: Colors.ink },
  upcomingSub:   { fontSize: 11.5, color: Colors.ink3, marginTop: 1 },
  upcomingWhen:  { fontSize: 11, color: Colors.ink3 },

  toolGrid:  { paddingHorizontal: 16, flexDirection: 'row', gap: 12 },
  toolTitle: { fontSize: 13, fontWeight: '600', color: Colors.ink, marginTop: 8 },
  toolSub:   { fontSize: 11, color: Colors.ink3, marginTop: 2 },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const cm = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.line, alignSelf: 'center', marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.ink },

  tabs: {
    flexDirection: 'row', gap: 8, marginBottom: 20,
    backgroundColor: Colors.chip, borderRadius: 14, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.surface },
  tabText: { fontSize: 12, fontWeight: '500', color: Colors.ink3 },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },

  inputLabel: { fontSize: 12, color: Colors.ink3, marginBottom: 10, fontWeight: '500' },
  inputRow:   { flexDirection: 'row', gap: 10, marginBottom: 16 },
  inputWrap:  { flex: 1, gap: 4 },
  inputHint:  { fontSize: 10.5, color: Colors.ink3, fontWeight: '500', textTransform: 'uppercase' },
  input: {
    backgroundColor: Colors.chip, borderRadius: 12,
    padding: 12, fontSize: 16, color: Colors.ink, fontWeight: '600', textAlign: 'center',
  },
  convertBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    padding: 14, alignItems: 'center', marginBottom: 16,
  },
  convertBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  resultBox: {
    backgroundColor: Colors.primarySoft, borderRadius: 14,
    padding: 16, marginBottom: 8, gap: 4,
  },
  resultLabel: { fontSize: 11, color: Colors.ink3, fontWeight: '600', textTransform: 'uppercase' },
  resultText:  { fontSize: 20, fontWeight: '700', color: Colors.primaryInk },
  resultNote:  { fontSize: 11, color: Colors.ink3, marginTop: 4, lineHeight: 16 },

  eventItem: {
    flexDirection: 'row', gap: 14, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  eventIcon:  { fontSize: 24, marginTop: 2 },
  eventLabel: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  eventHijri: { fontSize: 12, color: Colors.primary, marginTop: 1, fontWeight: '500' },
  eventGreg:  { fontSize: 12, color: Colors.ink3, marginTop: 1 },
  eventDesc:  { fontSize: 11.5, color: Colors.ink2, marginTop: 3, lineHeight: 17 },
});
