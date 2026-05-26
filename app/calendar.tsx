import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Radius } from '../constants/theme';
import Card from '../components/ui/Card';
import { HIJRI_MONTHS, HIJRI_EVENTS } from '../services/prayerApi';

const DOW = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const GREG_MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const GREG_MONTHS_LONG  = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAY_NAMES = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

interface DayCell {
  hijriDay: number;
  gregDay: number;
  gregMonth: string;
  isOther: boolean;
  hasEvent?: boolean;
  eventColor?: string;
  eventLabel?: string;
}

// ─── Date conversion utilities (arithmetic / tabular Islamic calendar) ────────

/** Gregorian → Julian Day Number */
function gregToJDN(gy: number, gm: number, gd: number): number {
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  return gd + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/** Hijri → Julian Day Number */
function hijriToJDN(hy: number, hm: number, hd: number): number {
  return Math.floor((11 * hy + 3) / 30) + 354 * hy
    + 30 * hm - Math.floor((hm - 1) / 2) + hd + 1948440 - 385;
}

/** Julian Day Number → Gregorian */
function jdnToGreg(jdn: number): { y: number; m: number; d: number } {
  let l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const d = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const m = j + 2 - 12 * l;
  const y = 100 * (n - 49) + i + l;
  return { y, m, d };
}

/** Hijri → Gregorian */
function hijriToGregorian(hy: number, hm: number, hd: number) {
  return jdnToGreg(hijriToJDN(hy, hm, hd));
}

/** Gregorian → Hijri (search-based, accurate to arithmetic calendar) */
function gregorianToHijri(gy: number, gm: number, gd: number) {
  const target = gregToJDN(gy, gm, gd);
  let hy = Math.floor((target - 1948440) / 354.367);
  while (hijriToJDN(hy + 1, 1, 1) <= target) hy++;
  while (hijriToJDN(hy, 1, 1) > target) hy--;
  let hm = 1;
  while (hm < 12 && hijriToJDN(hy, hm + 1, 1) <= target) hm++;
  const hd = target - hijriToJDN(hy, hm, 1) + 1;
  return { y: hy, m: hm, d: hd };
}

// ─── Today's Hijri day in the hardcoded Dzulhijjah 1447 calendar ─────────────
// Reference: 1 Dzulhijjah 1447 H ≈ 18 Mei 2026 (hardcoded approximation)
const DZULHIJJAH_START_MS = new Date(2026, 4, 18, 0, 0, 0, 0).getTime();

function computeTodayHijriDay(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - DZULHIJJAH_START_MS) / 86400000);
  return diff >= 0 && diff < 30 ? diff + 1 : 1;
}

// ─── Calendar grid ────────────────────────────────────────────────────────────
function buildCalendar(): DayCell[] {
  const days: DayCell[] = [];
  const events: Record<number, { color: string; label: string }> = {
    1:  { color: Colors.ink3,  label: 'Awal bulan' },
    8:  { color: Colors.gold,  label: 'Hari Tarwiyah' },
    9:  { color: Colors.gold,  label: 'Hari Arafah' },
    10: { color: Colors.error, label: 'Idul Adha' },
    11: { color: Colors.error, label: 'Hari Tasyrik' },
    12: { color: Colors.error, label: 'Hari Tasyrik' },
    13: { color: Colors.error, label: 'Hari Tasyrik' },
    15: { color: Colors.ink3,  label: 'Pertengahan bulan' },
  };
  // Padding: May 17 (Sunday) before Monday May 18
  days.push({ hijriDay: 30, gregDay: 17, gregMonth: 'Mei', isOther: true });
  for (let i = 1; i <= 30; i++) {
    const gDay = 17 + i;
    const gMonth = gDay > 31 ? 'Jun' : 'Mei';
    const g = gDay > 31 ? gDay - 31 : gDay;
    const ev = events[i];
    days.push({
      hijriDay: i, gregDay: g, gregMonth: gMonth, isOther: false,
      hasEvent: !!ev, eventColor: ev?.color, eventLabel: ev?.label,
    });
  }
  while (days.length < 42) {
    const n = days.length - 31;
    days.push({ hijriDay: n, gregDay: n, gregMonth: 'Jun', isOther: true });
  }
  return days;
}

// ─── Important dates for 1447 H ──────────────────────────────────────────────
const PENTING_DATES = Object.values(HIJRI_EVENTS)
  .flat()
  .sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day)
  .map(ev => {
    const g = hijriToGregorian(1447, ev.month, ev.day);
    const icon = ev.month === 9 ? '🌙'
      : ev.month === 10 ? '🎉'
      : ev.month === 12 && ev.day === 10 ? '🐑'
      : ev.month === 12 && ev.day >= 11 ? '📿'
      : ev.day === 1 && ev.month === 1 ? '🎊'
      : '📅';
    return {
      hijri: `${ev.day} ${HIJRI_MONTHS[ev.month]} 1447 H`,
      greg: `${g.d} ${GREG_MONTHS_SHORT[g.m - 1]} ${g.y}`,
      label: ev.label,
      desc: ev.desc,
      icon,
    };
  });

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

  const [selected, setSelected] = useState(todayHijriDay);
  const [hijriMonth]  = useState(12);
  const [hijriYear]   = useState(1447);

  // Converter modal state
  const [converterVisible, setConverterVisible] = useState(false);
  const [convMode, setConvMode] = useState<'g2h' | 'h2g'>('g2h');
  const [convD, setConvD] = useState('');
  const [convM, setConvM] = useState('');
  const [convY, setConvY] = useState('');
  const [convResult, setConvResult] = useState('');

  // Hari Penting modal state
  const [pentingVisible, setPentingVisible] = useState(false);

  const days = buildCalendar();
  const monthName = HIJRI_MONTHS[hijriMonth];
  const selDay = days.find(d => d.hijriDay === selected && !d.isOther);
  const upcoming = getUpcoming(todayHijriDay);

  // Gregorian date string for selected Hijri day
  const selGregDate = new Date(2026, 4, 17 + selected); // May 17 + selected = May 18 for day 1
  const selDayName  = DAY_NAMES[selGregDate.getDay()];
  const selGregStr  = `${selDayName} · ${selGregDate.getDate()} ${GREG_MONTHS_SHORT[selGregDate.getMonth()]} ${selGregDate.getFullYear()}`;

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
        <Text style={s.headerTitle}>Kalender Hijriah</Text>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.navigate('/(tabs)/menu' as any)}>
          <Ionicons name="settings-outline" size={20} color={Colors.ink2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month header */}
        <View style={s.monthHeader}>
          <View>
            <Text style={s.monthTitle}>
              {monthName} <Text style={{ color: Colors.primary }}>{hijriYear} H</Text>
            </Text>
            <Text style={s.monthSub}>18 Mei – 16 Juni 2026</Text>
          </View>
          <View style={s.monthNav}>
            <TouchableOpacity style={s.navBtn}>
              <Ionicons name="chevron-back" size={18} color={Colors.ink2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.todayBtn}
              onPress={() => setSelected(todayHijriDay)}
            >
              <Text style={s.todayBtnText}>Hari ini</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.navBtn}>
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
            const isSel   = !d.isOther && d.hijriDay === selected;
            const isToday = !d.isOther && d.hijriDay === todayHijriDay;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  s.dayCell,
                  isSel && s.dayCellSelected,
                  isToday && !isSel && s.dayCellToday,
                ]}
                onPress={() => !d.isOther && setSelected(d.hijriDay)}
                disabled={d.isOther}
              >
                <Text style={[
                  s.dayHijri,
                  isSel && { color: '#fff' },
                  isToday && !isSel && { fontWeight: '700' },
                  d.isOther && s.dayOther,
                ]}>
                  {d.hijriDay}
                </Text>
                <Text style={[
                  s.dayGreg,
                  isSel && { color: 'rgba(255,255,255,0.7)' },
                  d.isOther && { opacity: 0.4 },
                ]}>
                  {d.gregDay}
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
                <Text style={s.detailHijri}>{selected} {monthName} {hijriYear} H</Text>
                <Text style={s.detailGreg}>{selGregStr}</Text>
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
              <Text style={s.toolSub}>{PENTING_DATES.length} event tahunan</Text>
            </Card>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Converter Modal ──────────────────────────────────────────────────── */}
      <Modal visible={converterVisible} transparent animationType="slide" onRequestClose={() => setConverterVisible(false)}>
        <TouchableOpacity style={cm.overlay} activeOpacity={1} onPress={() => setConverterVisible(false)}>
          <TouchableOpacity style={cm.sheet} activeOpacity={1}>
            <View style={cm.handle} />
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Hari Penting Modal ───────────────────────────────────────────────── */}
      <Modal visible={pentingVisible} transparent animationType="slide" onRequestClose={() => setPentingVisible(false)}>
        <TouchableOpacity style={cm.overlay} activeOpacity={1} onPress={() => setPentingVisible(false)}>
          <TouchableOpacity style={[cm.sheet, { maxHeight: '85%' }]} activeOpacity={1}>
            <View style={cm.handle} />
            <View style={cm.modalHeader}>
              <Text style={cm.modalTitle}>Hari Penting 1447 H</Text>
              <TouchableOpacity onPress={() => setPentingVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {PENTING_DATES.map((item, i) => (
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
          </TouchableOpacity>
        </TouchableOpacity>
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
